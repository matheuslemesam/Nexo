"""
Módulo principal de extração de repositórios.
Orquestra o download, análise e extração de contexto do código.
"""

import io
import zipfile
import asyncio
import httpx
import fnmatch
from fastapi import HTTPException
from dataclasses import asdict

from services.github_api import GitHubAPIService
from services.file_analyzer import FileAnalyzer, directory_to_dict


# Configurações / Constantes
MAX_REPO_SIZE_BYTES = 50 * 1024 * 1024  # Limite de 50MB (Zipado)

# Limite de segurança para o contexto da IA (~12k tokens = ~48k chars)
MAX_CONTEXT_CHARS = 48000

# Limite máximo por arquivo individual (evita que um CHANGELOG.md gigante ocupe tudo)
MAX_FILE_CHARS = 8000

# Limite máximo para a estrutura de diretórios (para repos gigantes como React)
MAX_TREE_CHARS = 3000

# === CONSTANTES DE PRIORIZAÇÃO ===

# TIER 1: Arquivos que explicam O QUE o projeto faz (Documentação)
# IMPORTANTE: Usar padrões específicos para não pegar arquivos de código
TIER_1_DOCS = {
    "readme.md",
    "readme.txt",
    "readme.rst",
    "readme",
    "license",
    "license.md",
    "license.txt",
    "contributing.md",
    "contributing.txt",
    "changelog.md",
    "changelog.txt",
    "history.md",
    "architecture.md",
    "design.md",
    "api.md",
    "docs.md",
}

# TIER 2: Arquivos que explicam COMO o projeto roda (Configuração/Manifestos)
TIER_2_CONFIG = {
    # Node/JS
    "package.json",
    "tsconfig.json",
    "vercel.json",
    "next.config.js",
    "next.config.mjs",
    "vite.config.ts",
    "vite.config.js",
    # Python
    "requirements.txt",
    "pyproject.toml",
    "pipfile",
    "setup.py",
    "setup.cfg",
    # Infra/Docker
    "dockerfile*",
    "docker-compose*",
    "containerfile*",
    "make*",
    "procfile",
    # Outros
    "pom.xml",
    "build.gradle",
    "go.mod",
    "cargo.toml",
    "composer.json",
    "gemfile",
    ".env.example",
    "env.example",
}

# TIER 3: Pontos de entrada comuns (DESATIVADO - focando apenas em Docs e Config)
# TIER_3_ENTRYPOINTS = {
#     "main.py",
#     "app.py",
#     "index.py",
#     "manage.py",
#     "__main__.py",
#     "index.js",
#     "index.ts",
#     "main.js",
#     "main.ts",
#     "app.js",
#     "app.ts",
#     "index.jsx",
#     "index.tsx",
#     "app.jsx",
#     "app.tsx",
#     "main.go",
#     "main.rs",
#     "main.java",
#     "program.cs",
#     "index.html",
#     "index.php",
# }

IGNORED_DIRS = {
    ".git",
    ".github",
    ".vscode",
    ".idea",
    "__pycache__",
    "node_modules",
    "venv",
    "env",
    "dist",
    "build",
    "coverage",
    ".next",
    "target",
    ".mypy_cache",
    ".pytest_cache",
    ".tox",
    "vendor",
    "bower_components",
    ".cache",
    ".parcel-cache",
}

IGNORED_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".svg",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".exe",
    ".dll",
    ".so",
    ".pyc",
    ".lock",
    ".bin",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".mp3",
    ".mp4",
    ".wav",
    ".avi",
    ".mov",
    ".webm",
    ".webp",
}


def get_file_priority(filepath: str) -> int:
    """
    Define a prioridade de leitura do arquivo.
    0: Crítico (Docs) - README, LICENSE, etc.
    1: Alto (Configuração/Manifestos) - package.json, requirements.txt
    2: Baixo (Resto do código)
    """
    # Pega apenas o nome do arquivo (sem caminho)
    filename = filepath.lower().split("/")[-1]

    # Tier 1: Documentação (prioridade máxima) - match exato
    if filename in TIER_1_DOCS:
        return 0

    # Tier 2: Configuração e Infra - alguns usam wildcards
    for pattern in TIER_2_CONFIG:
        if "*" in pattern:
            if fnmatch.fnmatch(filename, pattern):
                return 1
        elif filename == pattern:
            return 1

    # Tier 3: Resto do código (IGNORADO no payload)
    return 2


def generate_tree_text(structure: dict, indent: str = "") -> str:
    """Gera uma representação textual da árvore de diretórios para a IA."""
    tree_str = ""
    keys = sorted(structure.keys())

    for i, key in enumerate(keys):
        is_last = i == len(keys) - 1
        prefix = "└── " if is_last else "├── "

        # Se for dict, é diretório
        if isinstance(structure[key], dict):
            tree_str += f"{indent}{prefix}{key}/\n"
            new_indent = indent + ("    " if is_last else "│   ")
            tree_str += generate_tree_text(structure[key], new_indent)
        else:
            tree_str += f"{indent}{prefix}{key}\n"

    return tree_str


async def _fetch_github_metadata(github_api: GitHubAPIService, github_url: str) -> dict:
    """
    Busca metadados do GitHub em paralelo.
    Retorna um dicionário com todas as informações obtidas.
    """
    try:
        # Executa todas as chamadas em paralelo
        results = await asyncio.gather(
            github_api.get_repo_metadata(github_url),
            github_api.get_contributors(github_url, limit=10),
            github_api.get_branches(github_url),
            github_api.get_languages(github_url),
            return_exceptions=True,  # Não falha se alguma chamada falhar
        )

        metadata, contributors, branches, languages = results

        # Trata possíveis exceções
        if isinstance(metadata, Exception):
            metadata = None
        if isinstance(contributors, Exception):
            contributors = []
        if isinstance(branches, Exception):
            branches = []
        if isinstance(languages, Exception):
            languages = {}

        return {
            "metadata": asdict(metadata) if metadata else None,
            "contributors": [asdict(c) for c in contributors] if contributors else [],
            "branches": [asdict(b) for b in branches] if branches else [],
            "languages": languages,
            "branch_count": len(branches) if branches else 0,
        }

    except Exception:
        # Se falhar completamente, retorna estrutura vazia
        return {
            "metadata": None,
            "contributors": [],
            "branches": [],
            "languages": {},
            "branch_count": 0,
        }


async def download_and_extract(github_url: str, branch: str = None, token: str = None) -> dict:
    """
    Baixa o repositório, PRIORIZA arquivos descritivos e monta contexto limitado.
    Retorna informações completas sobre o repositório com payload otimizado.
    """
    # Inicializa serviços
    github_api = GitHubAPIService(token=token)
    file_analyzer = FileAnalyzer(
        ignored_dirs=IGNORED_DIRS, ignored_extensions=IGNORED_EXTENSIONS
    )

    # Se a branch não for especificada, busca a branch padrão do repositório
    if not branch:
        print("🔍 Branch não especificada, buscando branch padrão do repositório...")
        metadata_preview = await _fetch_github_metadata(github_api, github_url)
        branch = metadata_preview.get("metadata", {}).get("default_branch", "main")
        print(f"📌 Usando branch padrão: {branch}")

    # Monta a URL do ZIP
    clean_url = github_url.rstrip("/")
    
    # Lista de branches para tentar (em ordem de prioridade)
    branches_to_try = [branch, "main", "master", "develop", "dev"]
    # Remove duplicatas mantendo a ordem
    branches_to_try = list(dict.fromkeys(branches_to_try))
    
    # Configura Headers (Autenticação se houver token)
    headers = {}
    if token:
        # GitHub aceita tanto "token" quanto "Bearer" para PATs
        headers["Authorization"] = f"token {token}"
        print(f"🔑 Usando token do GitHub (primeiros 10 chars): {token[:10]}...")
    else:
        print("⚠️ AVISO: Nenhum token GitHub fornecido - pode haver limite de rate")

    # Busca metadados do GitHub em paralelo com o download
    metadata_task = asyncio.create_task(_fetch_github_metadata(github_api, github_url))

    file_bytes = None
    successful_branch = None
    
    # Aumenta o timeout para repositórios grandes (120 segundos)
    timeout = httpx.Timeout(120.0, connect=30.0)
    async with httpx.AsyncClient(follow_redirects=True, timeout=timeout) as client:
        # Tenta cada branch até encontrar uma que funcione
        for try_branch in branches_to_try:
            zip_url = f"{clean_url}/archive/refs/heads/{try_branch}.zip"
            print(f"🌐 Tentando acessar branch '{try_branch}': {zip_url}")
            
            async with client.stream("GET", zip_url, headers=headers) as response:
                print(f"📊 Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    # Validação de Content-Length
                    content_length = response.headers.get("content-length")
                    if content_length and int(content_length) > MAX_REPO_SIZE_BYTES:
                        raise HTTPException(
                            status_code=413,
                            detail=f"Repositório muito grande ({int(content_length) / 1024 / 1024:.2f} MB). O limite é {MAX_REPO_SIZE_BYTES / 1024 / 1024} MB.",
                        )

                    # Se passou na verificação, lemos o conteúdo para a memória
                    file_bytes = await response.aread()
                    successful_branch = try_branch
                    print(f"✅ Branch '{try_branch}' encontrada!")
                    break
                elif response.status_code == 404:
                    print(f"⚠️ Branch '{try_branch}' não encontrada, tentando próxima...")
                    continue
                else:
                    raise HTTPException(
                        status_code=400, detail=f"Erro no GitHub: {response.status_code}"
                    )
        
        # Se nenhuma branch funcionou
        if file_bytes is None:
            print(f"❌ Nenhuma branch encontrada. Tentativas: {branches_to_try}")
            raise HTTPException(
                status_code=404,
                detail=f"Repositório não encontrado. Tentei as branches: {', '.join(branches_to_try)}. Verifique a URL ou se o Token é válido.",
            )

    # Aguarda os metadados do GitHub
    github_info = await metadata_task

    # === PROCESSAMENTO DO ZIP COM PRIORIZAÇÃO ===
    file_contents_buffer = []  # Lista para ordenação por prioridade
    errors = []

    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            for file_info in z.infolist():
                if file_info.is_dir():
                    continue

                try:
                    with z.open(file_info) as f:
                        content = f.read()

                        # Analisa o arquivo (estatísticas são coletadas para TODOS os arquivos)
                        should_process, decoded_content = file_analyzer.analyze_file(
                            filepath=file_info.filename,
                            content=content,
                            size_bytes=file_info.file_size,
                        )

                        if should_process and decoded_content:
                            # Calcula prioridade para ordenação
                            priority = get_file_priority(file_info.filename)

                            # Remove o prefixo da pasta raiz do zip (nome-branch/)
                            clean_path = "/".join(file_info.filename.split("/")[1:])

                            # Armazena para ordenação posterior
                            file_contents_buffer.append(
                                {
                                    "priority": priority,
                                    "path": clean_path,
                                    "content": decoded_content,
                                    "size": len(decoded_content),
                                }
                            )

                except Exception as e:
                    errors.append(f"Erro ao ler {file_info.filename}: {str(e)}")

    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=400, detail="O arquivo baixado não é um ZIP válido."
        )

    # Obtém resultado da análise (estatísticas de TODOS os arquivos)
    analysis = file_analyzer.get_result()

    # Converte estrutura de diretórios para dict
    dir_structure = directory_to_dict(analysis.directory_structure)

    # === MONTAGEM INTELIGENTE DO PAYLOAD ===

    # Ordena por prioridade: 0 (Docs) > 1 (Config) > 2 (Entrypoints) > 3 (Código)
    sorted_files = sorted(file_contents_buffer, key=lambda x: x["priority"])

    # Inicia o contexto com a estrutura de diretórios (muito útil para a IA)
    tree_representation = generate_tree_text(dir_structure)

    # Limita a estrutura de diretórios para repos gigantes
    if len(tree_representation) > MAX_TREE_CHARS:
        tree_representation = (
            tree_representation[:MAX_TREE_CHARS]
            + "\n... [TREE TRUNCATED - showing first ~3k chars]"
        )

    final_context = f"PROJECT FILE STRUCTURE:\n```\n{tree_representation}```\n\n"
    final_context += "SELECTED FILE CONTENTS (ordered by relevance):\n"

    current_chars = len(final_context)
    included_files_count = 0
    included_files_list = []

    for file_data in sorted_files:
        # IGNORA arquivos de código (Tier 2) - foca apenas em Docs e Config
        if file_data["priority"] >= 2:
            continue

        content_to_use = file_data["content"]
        is_truncated = False

        # Limita o tamanho individual do arquivo para não monopolizar o contexto
        if len(content_to_use) > MAX_FILE_CHARS:
            content_to_use = (
                content_to_use[:MAX_FILE_CHARS]
                + "\n... [FILE TRUNCATED - showing first ~8k chars]"
            )
            is_truncated = True

        # Formata o bloco do arquivo
        file_block = f"\n<file path='{file_data['path']}'>\n{content_to_use}\n</file>\n"
        block_len = len(file_block)

        # Se couber no orçamento, adiciona
        if current_chars + block_len <= MAX_CONTEXT_CHARS:
            final_context += file_block
            current_chars += block_len
            included_files_count += 1
            if is_truncated:
                included_files_list.append(f"{file_data['path']} (truncated)")
            else:
                included_files_list.append(file_data["path"])
        else:
            # Tenta truncar para caber
            remaining = MAX_CONTEXT_CHARS - current_chars
            if remaining > 500:  # Só adiciona se sobrar um pedaço útil
                truncated_content = (
                    content_to_use[: remaining - 150] + "\n... [CONTEXT LIMIT REACHED]"
                )
                final_context += f"\n<file path='{file_data['path']}'>\n{truncated_content}\n</file>\n"
                included_files_count += 1
                included_files_list.append(f"{file_data['path']} (truncated)")
            break  # Contexto cheio

    # === FORMATA ESTATÍSTICAS ===
    category_stats = {}
    for cat_name, cat_data in analysis.categories.items():
        if cat_data.count > 0 or analysis.ignored_files.get(cat_name, 0) > 0:
            category_stats[cat_name] = {
                "processed": cat_data.count,
                "ignored": analysis.ignored_files.get(cat_name, 0),
                "total_lines": cat_data.total_lines,
                "size_bytes": cat_data.total_size_bytes,
                "extensions": dict(cat_data.extensions),
            }

    # Formata dependências
    dependencies_info = []
    for dep in analysis.dependencies:
        dependencies_info.append(
            {
                "manager": dep.manager,
                "file": dep.file,
                "count": len(dep.dependencies) + len(dep.dev_dependencies),
                "dependencies": dep.dependencies,
                "dev_dependencies": dep.dev_dependencies,
            }
        )

    return {
        # Informações do GitHub (metadados)
        "github": github_info,
        # Estatísticas de arquivos
        "file_stats": {
            "total_files": analysis.total_files,
            "total_lines": analysis.total_lines,
            "total_size_bytes": analysis.total_size_bytes,
            "total_size_human": _format_bytes(analysis.total_size_bytes),
            "by_category": category_stats,
            "by_extension": dict(
                sorted(
                    analysis.files_by_extension.items(),
                    key=lambda x: x[1],
                    reverse=True,
                )[:20]
            ),  # Top 20 extensões
            # Novos campos de contexto
            "files_in_context": included_files_count,
            "total_files_analyzed": len(file_contents_buffer),
        },
        # Dependências detectadas
        "dependencies": dependencies_info,
        # Estrutura de diretórios
        "directory_structure": dir_structure,
        # Payload de contexto OTIMIZADO (priorizado e limitado)
        "payload": final_context,
        "payload_chars": len(final_context),
        "payload_max_chars": MAX_CONTEXT_CHARS,
        # Lista de arquivos incluídos no contexto (para debug)
        "included_files": included_files_list,
        # Erros durante processamento
        "errors": errors if errors else None,
    }


def _format_bytes(size_bytes: int) -> str:
    """Formata bytes para uma string legível."""
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.2f} TB"
