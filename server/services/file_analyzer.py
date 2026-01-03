"""
Módulo para análise de arquivos do repositório.
Responsável por categorizar e contar arquivos, linhas de código, dependências, etc.
"""

import re
from dataclasses import dataclass, field
from typing import Optional
from pathlib import PurePosixPath


# Mapeamento de extensões para categorias
FILE_CATEGORIES = {
    "code": {
        ".py",
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".java",
        ".c",
        ".cpp",
        ".h",
        ".hpp",
        ".cs",
        ".go",
        ".rs",
        ".rb",
        ".php",
        ".swift",
        ".kt",
        ".scala",
        ".r",
        ".m",
        ".lua",
        ".pl",
        ".sh",
        ".bash",
        ".zsh",
        ".ps1",
        ".sql",
        ".html",
        ".css",
        ".scss",
        ".sass",
        ".less",
        ".vue",
        ".svelte",
    },
    "config": {
        ".json",
        ".yaml",
        ".yml",
        ".toml",
        ".ini",
        ".cfg",
        ".conf",
        ".env",
        ".properties",
        ".xml",
        ".plist",
    },
    "docs": {".md", ".txt", ".rst", ".adoc", ".tex", ".rtf", ".doc", ".docx"},
    "assets": {
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".ico",
        ".svg",
        ".webp",
        ".bmp",
        ".mp3",
        ".mp4",
        ".wav",
        ".ogg",
        ".webm",
        ".avi",
        ".mov",
        ".ttf",
        ".otf",
        ".woff",
        ".woff2",
        ".eot",
    },
    "data": {".csv", ".tsv", ".xls", ".xlsx", ".parquet", ".arrow", ".db", ".sqlite"},
    "build": {".lock", ".sum", ".mod"},
    "binary": {
        ".exe",
        ".dll",
        ".so",
        ".dylib",
        ".bin",
        ".pyc",
        ".pyo",
        ".class",
        ".jar",
        ".war",
        ".ear",
        ".zip",
        ".tar",
        ".gz",
        ".rar",
        ".7z",
    },
}

# Arquivos de dependência conhecidos
DEPENDENCY_FILES = {
    "package.json": "npm",
    "package-lock.json": "npm",
    "yarn.lock": "yarn",
    "pnpm-lock.yaml": "pnpm",
    "requirements.txt": "pip",
    "Pipfile": "pipenv",
    "Pipfile.lock": "pipenv",
    "pyproject.toml": "poetry/pip",
    "poetry.lock": "poetry",
    "Cargo.toml": "cargo",
    "Cargo.lock": "cargo",
    "go.mod": "go",
    "go.sum": "go",
    "Gemfile": "bundler",
    "Gemfile.lock": "bundler",
    "composer.json": "composer",
    "composer.lock": "composer",
    "pom.xml": "maven",
    "build.gradle": "gradle",
    "build.gradle.kts": "gradle",
}


@dataclass
class FileStats:
    """Estatísticas de um arquivo."""

    path: str
    extension: str
    category: str
    lines: int
    size_bytes: int


@dataclass
class CategoryStats:
    """Estatísticas por categoria de arquivo."""

    count: int = 0
    total_lines: int = 0
    total_size_bytes: int = 0
    extensions: dict[str, int] = field(default_factory=dict)


@dataclass
class DependencyInfo:
    """Informações sobre dependências detectadas."""

    manager: str
    file: str
    dependencies: list[str] = field(default_factory=list)
    dev_dependencies: list[str] = field(default_factory=list)


@dataclass
class DirectoryNode:
    """Nó da estrutura de diretórios."""

    name: str
    is_dir: bool = True
    children: dict[str, "DirectoryNode"] = field(default_factory=dict)
    file_count: int = 0


@dataclass
class AnalysisResult:
    """Resultado completo da análise de arquivos."""

    total_files: int
    total_lines: int
    total_size_bytes: int
    categories: dict[str, CategoryStats]
    ignored_files: dict[str, int]  # categoria -> quantidade ignorada
    dependencies: list[DependencyInfo]
    directory_structure: DirectoryNode
    files_by_extension: dict[str, int]


class FileAnalyzer:
    """Analisador de arquivos do repositório."""

    def __init__(self, ignored_dirs: set[str], ignored_extensions: set[str]):
        self.ignored_dirs = ignored_dirs
        self.ignored_extensions = ignored_extensions
        self._reset_stats()

    def _reset_stats(self):
        """Reseta as estatísticas para uma nova análise."""
        self.total_files = 0
        self.total_lines = 0
        self.total_size_bytes = 0
        self.categories: dict[str, CategoryStats] = {
            "code": CategoryStats(),
            "config": CategoryStats(),
            "docs": CategoryStats(),
            "assets": CategoryStats(),
            "data": CategoryStats(),
            "build": CategoryStats(),
            "binary": CategoryStats(),
            "other": CategoryStats(),
        }
        self.ignored_files: dict[str, int] = {
            "code": 0,
            "config": 0,
            "docs": 0,
            "assets": 0,
            "data": 0,
            "build": 0,
            "binary": 0,
            "other": 0,
        }
        self.files_by_extension: dict[str, int] = {}
        self.dependencies: list[DependencyInfo] = []
        self.directory_root = DirectoryNode(name="root")

    def _get_file_category(self, extension: str) -> str:
        """Determina a categoria de um arquivo pela extensão."""
        ext_lower = extension.lower()
        for category, extensions in FILE_CATEGORIES.items():
            if ext_lower in extensions:
                return category
        return "other"

    def _is_in_ignored_dir(self, filepath: str) -> bool:
        """Verifica se o arquivo está em um diretório ignorado."""
        parts = filepath.split("/")
        return any(part in self.ignored_dirs for part in parts)

    def _is_ignored_extension(self, extension: str) -> bool:
        """Verifica se a extensão deve ser ignorada."""
        return extension.lower() in self.ignored_extensions

    def _add_to_directory_structure(self, filepath: str):
        """Adiciona um arquivo à estrutura de diretórios."""
        # Remove o prefixo do repo (ex: repo-main/)
        parts = filepath.split("/")
        if len(parts) > 1:
            parts = parts[1:]  # Remove o diretório raiz do zip

        current = self.directory_root
        for i, part in enumerate(parts):
            is_file = i == len(parts) - 1

            if part not in current.children:
                current.children[part] = DirectoryNode(name=part, is_dir=not is_file)

            if not is_file:
                current = current.children[part]
                current.file_count += 1

    def _parse_dependencies(
        self, filename: str, content: str
    ) -> Optional[DependencyInfo]:
        """Extrai dependências de arquivos de configuração."""
        basename = filename.split("/")[-1]

        if basename not in DEPENDENCY_FILES:
            return None

        manager = DEPENDENCY_FILES[basename]
        deps = []
        dev_deps = []

        try:
            if basename == "package.json":
                import json

                data = json.loads(content)
                deps = list(data.get("dependencies", {}).keys())
                dev_deps = list(data.get("devDependencies", {}).keys())

            elif basename == "requirements.txt":
                for line in content.split("\n"):
                    line = line.strip()
                    if line and not line.startswith("#") and not line.startswith("-"):
                        # Remove versão e extras
                        pkg = re.split(r"[<>=!~\[\]]", line)[0].strip()
                        if pkg:
                            deps.append(pkg)

            elif basename == "pyproject.toml":
                # Parse simples para dependências
                in_deps = False
                in_dev_deps = False
                for line in content.split("\n"):
                    if (
                        "[project.dependencies]" in line
                        or "[tool.poetry.dependencies]" in line
                    ):
                        in_deps = True
                        in_dev_deps = False
                    elif (
                        "[project.optional-dependencies]" in line
                        or "[tool.poetry.dev-dependencies]" in line
                    ):
                        in_deps = False
                        in_dev_deps = True
                    elif line.startswith("["):
                        in_deps = False
                        in_dev_deps = False
                    elif "=" in line and (in_deps or in_dev_deps):
                        pkg = line.split("=")[0].strip().strip('"').strip("'")
                        if pkg and not pkg.startswith("#"):
                            if in_deps:
                                deps.append(pkg)
                            else:
                                dev_deps.append(pkg)

            elif basename in ("Cargo.toml", "go.mod", "Gemfile"):
                # Parse básico - extrai nomes de pacotes
                patterns = {
                    "Cargo.toml": r"^\s*(\w[\w-]*)\s*=",
                    "go.mod": r"^\s*([\w./]+)\s+v",
                    "Gemfile": r"gem\s+['\"]([^'\"]+)['\"]",
                }
                pattern = patterns.get(basename)
                if pattern:
                    deps = re.findall(pattern, content, re.MULTILINE)

        except Exception:
            pass  # Ignora erros de parsing

        if deps or dev_deps:
            return DependencyInfo(
                manager=manager,
                file=basename,
                dependencies=deps[:50],  # Limita para não sobrecarregar
                dev_dependencies=dev_deps[:50],
            )

        return None

    def analyze_file(
        self, filepath: str, content: Optional[bytes], size_bytes: int
    ) -> tuple[bool, Optional[str]]:
        """
        Analisa um arquivo e atualiza as estatísticas.
        Retorna (should_process, decoded_content).
        """
        # Extrai extensão
        path = PurePosixPath(filepath)
        extension = path.suffix.lower() if path.suffix else ""
        basename = path.name

        # Atualiza contagem por extensão (antes de ignorar)
        if extension:
            self.files_by_extension[extension] = (
                self.files_by_extension.get(extension, 0) + 1
            )

        # Determina categoria
        category = self._get_file_category(extension)

        # Adiciona à estrutura de diretórios (antes de ignorar)
        self._add_to_directory_structure(filepath)

        # Verifica se deve ser ignorado
        is_ignored = self._is_in_ignored_dir(filepath) or self._is_ignored_extension(
            extension
        )

        # Arquivos ocultos (exceto alguns permitidos)
        allowed_hidden = {".env.example", ".gitignore", "Dockerfile", ".dockerignore"}
        if basename.startswith(".") and basename not in allowed_hidden:
            is_ignored = True

        if is_ignored:
            self.ignored_files[category] = self.ignored_files.get(category, 0) + 1
            return False, None

        # Tenta decodificar o conteúdo
        decoded_content = None
        lines = 0

        if content:
            try:
                decoded_content = content.decode("utf-8")
                lines = decoded_content.count("\n") + 1
            except UnicodeDecodeError:
                # Arquivo binário disfarçado
                self.ignored_files[category] = self.ignored_files.get(category, 0) + 1
                return False, None

        # Atualiza estatísticas
        self.total_files += 1
        self.total_lines += lines
        self.total_size_bytes += size_bytes

        cat_stats = self.categories[category]
        cat_stats.count += 1
        cat_stats.total_lines += lines
        cat_stats.total_size_bytes += size_bytes
        cat_stats.extensions[extension] = cat_stats.extensions.get(extension, 0) + 1

        # Verifica se é arquivo de dependência
        if decoded_content:
            dep_info = self._parse_dependencies(filepath, decoded_content)
            if dep_info:
                self.dependencies.append(dep_info)

        return True, decoded_content

    def get_result(self) -> AnalysisResult:
        """Retorna o resultado da análise."""
        return AnalysisResult(
            total_files=self.total_files,
            total_lines=self.total_lines,
            total_size_bytes=self.total_size_bytes,
            categories=self.categories,
            ignored_files=self.ignored_files,
            dependencies=self.dependencies,
            directory_structure=self.directory_root,
            files_by_extension=self.files_by_extension,
        )


def directory_to_dict(
    node: DirectoryNode, max_depth: int = 4, current_depth: int = 0
) -> dict:
    """Converte a estrutura de diretórios para um dicionário serializável."""
    if current_depth >= max_depth:
        if node.children:
            return {"...": f"{len(node.children)} items"}
        return {}

    result = {}

    # Ordena: diretórios primeiro, depois arquivos
    sorted_children = sorted(
        node.children.items(), key=lambda x: (not x[1].is_dir, x[0])
    )

    for name, child in sorted_children[:30]:  # Limita para não sobrecarregar
        if child.is_dir:
            result[f"{name}/"] = directory_to_dict(child, max_depth, current_depth + 1)
        else:
            result[name] = None

    if len(node.children) > 30:
        result["..."] = f"+{len(node.children) - 30} more files"

    return result
