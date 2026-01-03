"""
Schemas para o endpoint unificado de Análise.
Combina extração de dados + geração de overview em uma única resposta.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict

from schemas.extract import (
    RepositoryInfoSchema,
    FileAnalysisSchema,
    DependencySchema,
    ContextSchema,
)
from schemas.overview import OverviewUsageSchema


class AnalyzeResponseSchema(BaseModel):
    """
    Resposta unificada do endpoint de análise.
    Combina dados de extração com overview gerado por IA.
    """

    status: str = Field(..., description="Status da operação (success/partial/error)")

    # === Dados do Repositório (do Extract) ===
    repository: Optional[RepositoryInfoSchema] = Field(
        None, description="Informações do repositório"
    )
    file_analysis: Optional[FileAnalysisSchema] = Field(
        None, description="Análise de arquivos"
    )
    dependencies: List[DependencySchema] = Field(
        default_factory=list, description="Dependências detectadas"
    )
    directory_structure: Dict = Field(
        default_factory=dict, description="Estrutura de diretórios"
    )

    # === Overview Gerado pela IA ===
    overview: Optional[str] = Field(
        None, description="Resumo em Markdown gerado pela IA"
    )
    overview_usage: Optional[OverviewUsageSchema] = Field(
        None, description="Estatísticas de uso da API Gemini"
    )

    # === Contexto e Metadados ===
    context: Optional[ContextSchema] = Field(
        None, description="Contexto extraído para IA"
    )

    # === Erros ===
    errors: Optional[List[str]] = Field(
        None, description="Lista de erros durante o processamento"
    )
    overview_error: Optional[str] = Field(
        None, description="Erro específico na geração do overview (se houver)"
    )

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
                    "by_category": {},
                    "top_extensions": {".py": 20, ".js": 10},
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
                "directory_structure": {"src/": {"main.py": None}},
                "overview": "# 🚀 Example Repo\n\nUm projeto incrível...",
                "overview_usage": {
                    "prompt_tokens": 1500,
                    "completion_tokens": 800,
                    "total_tokens": 2300,
                },
                "context": {
                    "payload": "<file>...</file>",
                    "total_chars": 15000,
                    "estimated_tokens": 3750,
                    "max_chars": 48000,
                    "files_in_context": 10,
                    "total_analyzed": 50,
                    "included_files": ["README.md"],
                },
                "errors": None,
                "overview_error": None,
            }
        }
