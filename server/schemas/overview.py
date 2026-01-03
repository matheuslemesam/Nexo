"""
Schemas para o endpoint de Overview.
Define os modelos de resposta para geração de resumos com IA.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class OverviewUsageSchema(BaseModel):
    """Estatísticas de uso da API do Gemini."""

    prompt_tokens: int = Field(0, description="Tokens do prompt enviado")
    completion_tokens: int = Field(0, description="Tokens da resposta gerada")
    total_tokens: int = Field(0, description="Total de tokens consumidos")


class OverviewResponseSchema(BaseModel):
    """Resposta do endpoint de Overview."""

    status: str = Field(..., description="Status da operação (success/error)")
    repository_name: str = Field(..., description="Nome do repositório analisado")
    overview: Optional[str] = Field(
        None, description="Resumo em Markdown gerado pela IA"
    )
    error: Optional[str] = Field(None, description="Mensagem de erro (se houver)")
    usage: Optional[OverviewUsageSchema] = Field(
        None, description="Estatísticas de uso da API"
    )
    context_stats: Optional[Dict] = Field(
        None, description="Estatísticas do contexto usado"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "repository_name": "user/example-repo",
                "overview": "# 🚀 Example Repo\n\n## O que é?\nUm projeto incrível...",
                "error": None,
                "usage": {
                    "prompt_tokens": 1500,
                    "completion_tokens": 800,
                    "total_tokens": 2300,
                },
                "context_stats": {
                    "files_analyzed": 12,
                    "total_chars": 15000,
                    "estimated_tokens": 3750,
                },
            }
        }
