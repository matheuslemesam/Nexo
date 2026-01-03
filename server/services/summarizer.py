"""
Serviço de Resumo Inteligente de Repositórios.
Reduz drasticamente a quantidade de tokens mantendo informações essenciais.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class RepositorySummary:
    """Resumo compacto do repositório para envio ao LLM."""

    # Metadados básicos (~200 tokens)
    metadata: Dict[str, Any]

    # Estrutura de pastas simplificada (~300 tokens)
    folder_structure: str

    # Tecnologias e dependências (~200 tokens)
    technologies: Dict[str, Any]

    # README completo (~1000 tokens, mas importante)
    readme_content: Optional[str]

    # Snippets de arquivos chave (~1500 tokens)
    key_file_snippets: Dict[str, str]

    # Estatísticas de arquivos (~100 tokens)
    file_stats: Dict[str, Any]

    def to_prompt(self) -> str:
        """Converte o resumo para formato de prompt."""
        sections = []

        # 1. Metadados
        sections.append("## 📋 METADADOS DO PROJETO")
        if self.metadata and isinstance(self.metadata, dict):
            meta = self.metadata
            sections.append(f"- **Nome:** {meta.get('full_name') or 'N/A'}")
            sections.append(
                f"- **Descrição:** {meta.get('description') or 'Sem descrição'}"
            )
            sections.append(
                f"- **Linguagem Principal:** {meta.get('language') or 'N/A'}"
            )
            sections.append(f"- **Stars:** {meta.get('stargazers_count') or 0}")
            sections.append(f"- **Forks:** {meta.get('forks_count') or 0}")

            license_info = meta.get("license")
            if license_info and isinstance(license_info, dict):
                sections.append(f"- **Licença:** {license_info.get('name', 'N/A')}")
            elif license_info:
                sections.append(f"- **Licença:** {license_info}")
            else:
                sections.append("- **Licença:** N/A")

            sections.append(f"- **Último Update:** {meta.get('updated_at') or 'N/A'}")
        sections.append("")

        # 2. Estatísticas de Arquivos
        sections.append("## 📊 ESTATÍSTICAS")
        if self.file_stats:
            stats = self.file_stats
            sections.append(f"- **Total de Arquivos:** {stats.get('total_files', 0)}")
            sections.append(f"- **Total de Linhas:** {stats.get('total_lines', 0)}")
            sections.append(
                f"- **Tamanho Total:** {stats.get('total_size_human', 'N/A')}"
            )

            if "by_category" in stats and stats["by_category"]:
                sections.append("\n### Por Categoria:")
                for cat, info in stats["by_category"].items():
                    if info and isinstance(info, dict) and info.get("count", 0) > 0:
                        sections.append(
                            f"  - {cat}: {info['count']} arquivos ({info.get('size_human', 'N/A')})"
                        )
        sections.append("")

        # 3. Tecnologias
        sections.append("## 🛠️ TECNOLOGIAS DETECTADAS")
        if self.technologies:
            # Linguagens
            if "languages" in self.technologies:
                sections.append("### Linguagens:")
                for lang, bytes_count in self.technologies["languages"].items():
                    sections.append(f"  - {lang}: {bytes_count} bytes")

            # Dependências principais (limitadas)
            if "dependencies" in self.technologies:
                deps_list = self.technologies["dependencies"]

                # dependencies é uma lista de objetos
                if isinstance(deps_list, list):
                    for dep_obj in deps_list:
                        manager = dep_obj.get("manager", "unknown")

                        # NPM
                        if manager == "npm":
                            sections.append("\n### Dependências NPM (principais):")
                            all_deps = {
                                **dep_obj.get("dependencies", {}),
                                **dep_obj.get("dev_dependencies", {}),
                            }
                            for name, version in list(all_deps.items())[
                                :15
                            ]:  # Máximo 15
                                sections.append(f"  - {name}: {version}")
                            if len(all_deps) > 15:
                                sections.append(
                                    f"  - ... e mais {len(all_deps) - 15} dependências"
                                )

                        # Python
                        elif manager == "pip":
                            sections.append("\n### Dependências Python:")
                            python_deps = dep_obj.get("dependencies", [])
                            for dep in python_deps[:15]:  # Máximo 15
                                sections.append(f"  - {dep}")
                            if len(python_deps) > 15:
                                sections.append(
                                    f"  - ... e mais {len(python_deps) - 15} dependências"
                                )
        sections.append("")

        # 4. Estrutura de Pastas
        sections.append("## 📁 ESTRUTURA DO PROJETO")
        sections.append("```")
        sections.append(self.folder_structure or "Estrutura não disponível")
        sections.append("```")
        sections.append("")

        # 5. README
        if self.readme_content:
            sections.append("## 📖 README")
            # Limita o README a ~2000 caracteres para economizar tokens
            readme_truncated = self.readme_content[:2000]
            if len(self.readme_content) > 2000:
                readme_truncated += (
                    "\n\n[... README truncado para economizar tokens ...]"
                )
            sections.append(readme_truncated)
            sections.append("")

        # 6. Arquivos Chave (snippets)
        if self.key_file_snippets:
            sections.append("## 🔑 ARQUIVOS PRINCIPAIS (primeiras 30 linhas)")
            for filepath, content in self.key_file_snippets.items():
                sections.append(f"\n### `{filepath}`")
                sections.append("```")
                sections.append(content)
                sections.append("```")

        return "\n".join(sections)

    def estimate_tokens(self) -> int:
        """Estima o número de tokens do resumo."""
        # Aproximação: ~4 caracteres por token
        text = self.to_prompt()
        return len(text) // 4


class RepositorySummarizer:
    """Cria resumos compactos de repositórios para análise por LLM."""

    # Arquivos prioritários para incluir snippets
    PRIORITY_FILES = [
        # Entrypoints
        "main.py",
        "app.py",
        "index.ts",
        "index.js",
        "main.ts",
        "main.tsx",
        "App.tsx",
        "App.vue",
        "App.js",
        "main.go",
        "Main.java",
        "Program.cs",
        "index.php",
        "main.rs",
        "lib.rs",
        # Configs importantes
        "package.json",
        "pyproject.toml",
        "Cargo.toml",
        "go.mod",
        "pom.xml",
        "build.gradle",
        "composer.json",
        # Docker/Infra
        "docker-compose.yml",
        "docker-compose.yaml",
        "Dockerfile",
        "Containerfile",
        # CI/CD
        ".github/workflows/main.yml",
        ".gitlab-ci.yml",
    ]

    # Arquivos de documentação
    DOC_FILES = ["README.md", "readme.md", "README.rst", "README.txt", "README"]

    MAX_SNIPPET_LINES = 30
    MAX_STRUCTURE_DEPTH = 4

    def __init__(self, extraction_result: Dict[str, Any]):
        """
        Inicializa o summarizer com o resultado da extração.

        Args:
            extraction_result: Resultado do download_and_extract()
        """
        self.extraction = extraction_result
        self.payload = extraction_result.get("payload", {})
        self.github_info = extraction_result.get("github", {})
        self.file_stats = extraction_result.get("file_stats", {})
        self.dependencies = extraction_result.get(
            "dependencies", []
        )  # Lista, não dict!
        self.directory_structure = extraction_result.get("directory_structure", "")

    def summarize(self) -> RepositorySummary:
        """Gera um resumo compacto do repositório."""

        return RepositorySummary(
            metadata=self._extract_metadata(),
            folder_structure=self._simplify_structure(),
            technologies=self._extract_technologies(),
            readme_content=self._extract_readme(),
            key_file_snippets=self._extract_key_snippets(),
            file_stats=self._extract_stats(),
        )

    def _extract_metadata(self) -> Dict[str, Any]:
        """Extrai metadados essenciais."""
        meta = (self.github_info.get("metadata") or {}) if self.github_info else {}

        if not meta or not isinstance(meta, dict):
            return {}

        # Retorna apenas campos essenciais
        return {
            "full_name": meta.get("full_name"),
            "description": meta.get("description"),
            "language": meta.get("language"),
            "stargazers_count": meta.get("stargazers_count", 0),
            "forks_count": meta.get("forks_count", 0),
            "license": meta.get("license"),
            "updated_at": meta.get("updated_at"),
            "topics": meta.get("topics", [])[:5]
            if meta.get("topics")
            else [],  # Máximo 5 topics
            "default_branch": meta.get("default_branch"),
        }

    def _dict_to_tree(
        self, structure: Dict[str, Any], prefix: str = "", is_last: bool = True
    ) -> str:
        """Converte dicionário de estrutura para formato de árvore."""
        lines = []

        if isinstance(structure, dict):
            items = list(structure.items())
            for i, (name, content) in enumerate(items):
                is_last_item = i == len(items) - 1
                connector = "└── " if is_last_item else "├── "
                lines.append(f"{prefix}{connector}{name}")

                if isinstance(content, dict) and content:
                    extension = "    " if is_last_item else "│   "
                    lines.append(
                        self._dict_to_tree(content, prefix + extension, is_last_item)
                    )

        return "\n".join(lines)

    def _simplify_structure(self) -> str:
        """Simplifica a estrutura de diretórios."""
        structure = self.directory_structure

        if not structure:
            return "Estrutura não disponível"

        # Se for dict, converte para string formatada
        if isinstance(structure, dict):
            structure = self._dict_to_tree(structure)

        # Se a estrutura for muito grande, trunca
        lines = structure.split("\n")

        # Filtra linhas muito profundas (muitos espaços de indentação)
        filtered_lines = []
        for line in lines:
            # Conta a profundidade pela indentação
            stripped = line.lstrip()
            indent = len(line) - len(stripped)
            depth = indent // 2  # Assumindo 2 espaços por nível

            if depth <= self.MAX_STRUCTURE_DEPTH:
                filtered_lines.append(line)
            elif depth == self.MAX_STRUCTURE_DEPTH + 1 and not filtered_lines[
                -1
            ].endswith("..."):
                filtered_lines.append(line[:indent] + "...")

        # Limita a 50 linhas
        if len(filtered_lines) > 50:
            filtered_lines = filtered_lines[:50]
            filtered_lines.append("... (estrutura truncada)")

        return "\n".join(filtered_lines)

    def _extract_technologies(self) -> Dict[str, Any]:
        """Extrai tecnologias e dependências."""
        return {
            "languages": self.github_info.get("languages", {})
            if self.github_info
            else {},
            "dependencies": self.dependencies if self.dependencies else [],
        }

    def _extract_readme(self) -> Optional[str]:
        """Extrai conteúdo do README."""
        if not self.payload:
            return None

        # Se payload é string, tenta extrair README dela
        if isinstance(self.payload, str):
            # Procura por padrões de README no texto
            for doc_file in self.DOC_FILES:
                pattern = f"===== {doc_file.upper()}"
                if pattern in self.payload.upper():
                    # Extrai conteúdo entre marcadores
                    start_idx = self.payload.upper().find(pattern)
                    if start_idx != -1:
                        # Pega até próximo ===== ou fim
                        end_idx = self.payload.find("=====", start_idx + len(pattern))
                        if end_idx == -1:
                            return self.payload[start_idx : start_idx + 3000]
                        else:
                            return self.payload[start_idx:end_idx]
            return None

        # Se for dict, busca normalmente
        files_dict = (
            self.payload.get("files", {}) if isinstance(self.payload, dict) else {}
        )

        # Procura por arquivos README
        for doc_file in self.DOC_FILES:
            # Busca no nível raiz
            for filepath, content in files_dict.items():
                filename = filepath.split("/")[-1]
                if filename.lower() == doc_file.lower():
                    return content

        return None

    def _extract_key_snippets(self) -> Dict[str, str]:
        """Extrai snippets dos arquivos mais importantes."""
        if not self.payload:
            return {}

        # Se payload é string, não podemos extrair snippets específicos
        if isinstance(self.payload, str):
            return {"payload": self.payload[:2000] + "\n\n... (truncado)"}

        files_dict = (
            self.payload.get("files", {}) if isinstance(self.payload, dict) else {}
        )
        snippets = {}

        # Ordena arquivos por prioridade
        found_files = []
        for filepath in files_dict.keys():
            filename = filepath.split("/")[-1]

            # Verifica se é um arquivo prioritário
            for priority_file in self.PRIORITY_FILES:
                if filepath.endswith(priority_file) or filename == priority_file:
                    found_files.append(
                        (
                            filepath,
                            self.PRIORITY_FILES.index(priority_file)
                            if priority_file in self.PRIORITY_FILES
                            else 999,
                        )
                    )
                    break

        # Ordena por prioridade e pega os top 5
        found_files.sort(key=lambda x: x[1])
        top_files = [f[0] for f in found_files[:5]]

        # Se não encontrou arquivos prioritários, pega os maiores arquivos de código
        if len(top_files) < 3:
            code_extensions = {
                ".py",
                ".ts",
                ".tsx",
                ".js",
                ".jsx",
                ".go",
                ".rs",
                ".java",
                ".cs",
            }
            code_files = []

            for filepath, content in files_dict.items():
                ext = "." + filepath.split(".")[-1] if "." in filepath else ""
                if ext in code_extensions and filepath not in top_files:
                    code_files.append((filepath, len(content)))

            # Adiciona os maiores arquivos de código
            code_files.sort(key=lambda x: x[1], reverse=True)
            for filepath, _ in code_files[: 5 - len(top_files)]:
                top_files.append(filepath)

        # Extrai snippets
        for filepath in top_files:
            content = files_dict.get(filepath, "")
            lines = content.split("\n")
            snippet = "\n".join(lines[: self.MAX_SNIPPET_LINES])

            if len(lines) > self.MAX_SNIPPET_LINES:
                snippet += (
                    f"\n\n// ... +{len(lines) - self.MAX_SNIPPET_LINES} linhas omitidas"
                )

            snippets[filepath] = snippet

        return snippets

    def _extract_stats(self) -> Dict[str, Any]:
        """Extrai estatísticas resumidas."""
        if not self.file_stats or not isinstance(self.file_stats, dict):
            return {
                "total_files": 0,
                "total_lines": 0,
                "total_size_human": "0 B",
                "by_category": {},
            }

        return {
            "total_files": self.file_stats.get("total_files", 0),
            "total_lines": self.file_stats.get("total_lines", 0),
            "total_size_human": self.file_stats.get("total_size_human", "N/A"),
            "by_category": self.file_stats.get("by_category", {}),
        }


def create_optimized_prompt(extraction_result: Dict[str, Any]) -> str:
    """
    Cria um prompt otimizado a partir do resultado da extração.

    Esta função é a forma recomendada de preparar dados para o Gemini,
    reduzindo drasticamente o uso de tokens.

    Args:
        extraction_result: Resultado do download_and_extract()

    Returns:
        String formatada pronta para envio ao LLM
    """
    try:
        if not extraction_result or not isinstance(extraction_result, dict):
            raise ValueError("extraction_result inválido ou vazio")

        summarizer = RepositorySummarizer(extraction_result)
        summary = summarizer.summarize()

        prompt = summary.to_prompt()
        estimated_tokens = summary.estimate_tokens()

        logger.info(f"📊 Resumo gerado: ~{estimated_tokens} tokens estimados")

        return prompt
    except Exception as e:
        import traceback

        error_trace = traceback.format_exc()
        logger.error(f"ERRO em create_optimized_prompt:\n{error_trace}")
        raise
