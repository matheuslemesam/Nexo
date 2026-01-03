"""
Módulo principal de extração de repositórios.
Orquestra o download, análise e extração de contexto do código.
"""

import io
import zipfile
import asyncio
import httpx
from fastapi import HTTPException
from dataclasses import asdict

from services.github_api import GitHubAPIService
from services.file_analyzer import FileAnalyzer, directory_to_dict


# Configurações / Constantes
MAX_REPO_SIZE_BYTES = 50 * 1024 * 1024  # Limite de 50MB (Zipado)

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


async def download_and_extract(github_url: str, branch: str, token: str = None) -> dict:
    """
    Baixa o repositório, valida tamanho, analisa arquivos e extrai o texto.
    Retorna informações completas sobre o repositório.
    """
    # Inicializa serviços
    github_api = GitHubAPIService(token=token)
    file_analyzer = FileAnalyzer(
        ignored_dirs=IGNORED_DIRS, ignored_extensions=IGNORED_EXTENSIONS
    )

    # Monta a URL do ZIP
    clean_url = github_url.rstrip("/")
    zip_url = f"{clean_url}/archive/refs/heads/{branch}.zip"

    # Configura Headers (Autenticação se houver token)
    headers = {}
    if token:
        headers["Authorization"] = f"token {token}"

    # Busca metadados do GitHub em paralelo com o download
    metadata_task = asyncio.create_task(_fetch_github_metadata(github_api, github_url))

    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Usamos .stream() para ler os headers ANTES de baixar o corpo
        async with client.stream("GET", zip_url, headers=headers) as response:
            if response.status_code != 200:
                if response.status_code == 404:
                    raise HTTPException(
                        status_code=404,
                        detail="Repositório não encontrado. Verifique a URL, a Branch ou se o Token é válido para este repo.",
                    )
                raise HTTPException(
                    status_code=400, detail=f"Erro no GitHub: {response.status_code}"
                )

            # Validação de Content-Length
            content_length = response.headers.get("content-length")
            if content_length and int(content_length) > MAX_REPO_SIZE_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"Repositório muito grande ({int(content_length) / 1024 / 1024:.2f} MB). O limite é {MAX_REPO_SIZE_BYTES / 1024 / 1024} MB.",
                )

            # Se passou na verificação, lemos o conteúdo para a memória
            file_bytes = await response.aread()

    # Aguarda os metadados do GitHub
    github_info = await metadata_task

    # Processamento do ZIP
    full_code_context = ""
    errors = []

    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            for file_info in z.infolist():
                if file_info.is_dir():
                    continue

                try:
                    with z.open(file_info) as f:
                        content = f.read()

                        # Analisa o arquivo (retorna se deve processar e conteúdo decodificado)
                        should_process, decoded_content = file_analyzer.analyze_file(
                            filepath=file_info.filename,
                            content=content,
                            size_bytes=file_info.file_size,
                        )

                        if should_process and decoded_content:
                            # Formatação para o Gemini
                            full_code_context += (
                                f"\n<file path='{file_info.filename}'>\n"
                            )
                            full_code_context += decoded_content
                            full_code_context += "\n</file>\n"

                except Exception as e:
                    errors.append(f"Erro ao ler {file_info.filename}: {str(e)}")

    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=400, detail="O arquivo baixado não é um ZIP válido."
        )

    # Obtém resultado da análise
    analysis = file_analyzer.get_result()

    # Converte estrutura de diretórios para dict
    dir_structure = directory_to_dict(analysis.directory_structure)

    # Formata estatísticas por categoria
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
        },
        # Dependências detectadas
        "dependencies": dependencies_info,
        # Estrutura de diretórios
        "directory_structure": dir_structure,
        # Payload de contexto (para o Gemini)
        "payload": full_code_context,
        "payload_chars": len(full_code_context),
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
