"""
Schemas para extração de repositórios.
Define os modelos de resposta da API de extração.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict


# === Schemas de Contribuidores ===
class ContributorSchema(BaseModel):
    """Informações de um contribuidor do repositório."""

    username: str = Field(..., description="Nome de usuário no GitHub")
    avatar_url: str = Field(..., description="URL do avatar")
    contributions: int = Field(..., description="Número de contribuições")
    profile_url: str = Field(..., description="URL do perfil no GitHub")


# === Schemas de Branches ===
class BranchSchema(BaseModel):
    """Informações de uma branch."""

    name: str = Field(..., description="Nome da branch")
    is_protected: bool = Field(..., description="Se a branch é protegida")


class BranchesInfoSchema(BaseModel):
    """Informações consolidadas de branches."""

    count: int = Field(..., description="Número total de branches")
    list: List[BranchSchema] = Field(..., description="Lista de branches")


# === Schemas de Metadados do Repositório ===
class RepoMetadataSchema(BaseModel):
    """Metadados básicos do repositório."""

    name: str = Field(..., description="Nome do repositório")
    full_name: str = Field(..., description="Nome completo (owner/repo)")
    description: Optional[str] = Field(None, description="Descrição do repositório")
    stars: int = Field(..., description="Número de estrelas")
    forks: int = Field(..., description="Número de forks")
    open_issues: int = Field(..., description="Número de issues abertas")
    watchers: int = Field(..., description="Número de watchers")
    default_branch: str = Field(..., description="Branch padrão")
    language: Optional[str] = Field(None, description="Linguagem principal")
    created_at: str = Field(..., description="Data de criação")
    updated_at: str = Field(..., description="Data da última atualização")
    size_kb: int = Field(..., description="Tamanho em KB")
    is_private: bool = Field(..., description="Se é repositório privado")
    topics: List[str] = Field(default_factory=list, description="Tópicos/tags")


class RepositoryInfoSchema(BaseModel):
    """Informações completas do repositório."""

    info: Optional[RepoMetadataSchema] = Field(None, description="Metadados básicos")
    contributors: List[ContributorSchema] = Field(
        default_factory=list, description="Contribuidores"
    )
    branches: BranchesInfoSchema = Field(..., description="Informações de branches")
    languages: Dict[str, int] = Field(
        default_factory=dict, description="Linguagens (bytes por linguagem)"
    )


# === Schemas de Análise de Arquivos ===
class CategoryStatsSchema(BaseModel):
    """Estatísticas por categoria de arquivo."""

    processed: int = Field(..., description="Arquivos processados")
    ignored: int = Field(..., description="Arquivos ignorados")
    total_lines: int = Field(..., description="Total de linhas de código")
    size_bytes: int = Field(..., description="Tamanho total em bytes")
    extensions: Dict[str, int] = Field(
        default_factory=dict, description="Contagem por extensão"
    )


class FileSummarySchema(BaseModel):
    """Resumo geral de arquivos."""

    total_files: int = Field(..., description="Total de arquivos processados")
    total_lines: int = Field(..., description="Total de linhas de código")
    total_size: str = Field(..., description="Tamanho total (formatado)")
    files_in_context: Optional[int] = Field(
        None, description="Arquivos incluídos no contexto IA"
    )
    total_analyzed: Optional[int] = Field(
        None, description="Total de arquivos analisados"
    )


class FileAnalysisSchema(BaseModel):
    """Análise completa de arquivos."""

    summary: FileSummarySchema = Field(..., description="Resumo geral")
    by_category: Dict[str, CategoryStatsSchema] = Field(
        default_factory=dict, description="Stats por categoria"
    )
    top_extensions: Dict[str, int] = Field(
        default_factory=dict, description="Top extensões"
    )


# === Schemas de Dependências ===
class DependencySchema(BaseModel):
    """Informações de dependências detectadas."""

    manager: str = Field(..., description="Gerenciador de pacotes")
    file: str = Field(..., description="Arquivo de origem")
    count: int = Field(..., description="Total de dependências")
    dependencies: List[str] = Field(
        default_factory=list, description="Dependências de produção"
    )
    dev_dependencies: List[str] = Field(
        default_factory=list, description="Dependências de desenvolvimento"
    )


# === Schemas de Contexto IA ===
class ContextSchema(BaseModel):
    """Contexto extraído para análise IA."""

    payload: str = Field(..., description="Conteúdo formatado dos arquivos")
    total_chars: int = Field(..., description="Total de caracteres")
    estimated_tokens: int = Field(..., description="Estimativa de tokens (chars/4)")
    max_chars: int = Field(..., description="Limite máximo de caracteres configurado")
    files_in_context: int = Field(
        ..., description="Número de arquivos incluídos no payload"
    )
    total_analyzed: int = Field(
        ..., description="Total de arquivos analisados no repositório"
    )
    included_files: List[str] = Field(
        default_factory=list,
        description="Lista de arquivos incluídos no contexto (em ordem de prioridade)",
    )


# === Schema de Resposta Principal ===
class ExtractResponseSchema(BaseModel):
    """Resposta completa da extração de repositório."""

    status: str = Field(..., description="Status da operação")
    repository: RepositoryInfoSchema = Field(
        ..., description="Informações do repositório"
    )
    file_analysis: FileAnalysisSchema = Field(..., description="Análise de arquivos")
    dependencies: List[DependencySchema] = Field(
        default_factory=list, description="Dependências detectadas"
    )
    directory_structure: Dict = Field(
        default_factory=dict, description="Estrutura de diretórios"
    )
    context: ContextSchema = Field(..., description="Contexto para IA")
    errors: Optional[List[str]] = Field(None, description="Erros durante processamento")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "repository": {
                    "info": {
                        "name": "example-repo",
                        "full_name": "user/example-repo",
                        "description": "An example repository",
                        "stars": 150,
                        "forks": 25,
                        "open_issues": 5,
                        "watchers": 150,
                        "default_branch": "main",
                        "language": "Python",
                        "created_at": "2024-01-01T00:00:00Z",
                        "updated_at": "2025-01-03T00:00:00Z",
                        "size_kb": 1024,
                        "is_private": False,
                        "topics": ["python", "api"],
                    },
                    "contributors": [
                        {
                            "username": "developer1",
                            "avatar_url": "https://github.com/avatars/1",
                            "contributions": 100,
                            "profile_url": "https://github.com/developer1",
                        }
                    ],
                    "branches": {
                        "count": 3,
                        "list": [{"name": "main", "is_protected": True}],
                    },
                    "languages": {"Python": 50000, "JavaScript": 10000},
                },
                "file_analysis": {
                    "summary": {
                        "total_files": 50,
                        "total_lines": 5000,
                        "total_size": "250.00 KB",
                    },
                    "by_category": {
                        "code": {
                            "processed": 30,
                            "ignored": 0,
                            "total_lines": 4000,
                            "size_bytes": 200000,
                            "extensions": {".py": 20, ".js": 10},
                        }
                    },
                    "top_extensions": {".py": 20, ".js": 10, ".md": 5},
                },
                "dependencies": [
                    {
                        "manager": "pip",
                        "file": "requirements.txt",
                        "count": 10,
                        "dependencies": ["fastapi", "uvicorn"],
                        "dev_dependencies": [],
                    }
                ],
                "directory_structure": {
                    "src/": {"main.py": None, "utils/": {"helpers.py": None}},
                    "README.md": None,
                },
                "context": {
                    "payload": "<file path='src/main.py'>...</file>",
                    "total_chars": 50000,
                    "estimated_tokens": 12500,
                    "max_chars": 48000,
                    "files_in_context": 15,
                    "total_analyzed": 50,
                    "included_files": ["README.md", "requirements.txt", "src/main.py"],
                },
                "errors": None,
            }
        }
