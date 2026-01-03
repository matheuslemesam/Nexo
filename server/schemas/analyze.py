"""
Schemas para análise de projetos com IA.
Define os modelos de request/response da API de análise.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict


# === Request Schemas ===


class AnalyzeRequestSchema(BaseModel):
    """Schema de request para análise de repositório."""

    github_url: str = Field(
        ...,
        description="URL do repositório GitHub",
        example="https://github.com/owner/repo",
    )
    branch: str = Field(default="main", description="Branch para analisar")
    token: Optional[str] = Field(
        default=None, description="Token de acesso para repositórios privados"
    )
    analysis_type: str = Field(
        default="onboarding",
        description="Tipo de análise: 'onboarding' (completa) ou 'quick' (rápida)",
    )
    include_code: bool = Field(
        default=True, description="Se deve incluir o código fonte na análise"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "github_url": "https://github.com/fastapi/fastapi",
                "branch": "main",
                "token": None,
                "analysis_type": "onboarding",
                "include_code": True,
            }
        }


class CustomAnalysisRequestSchema(BaseModel):
    """Schema de request para análise customizada."""

    github_url: str = Field(..., description="URL do repositório GitHub")
    branch: str = Field(default="main", description="Branch para analisar")
    token: Optional[str] = Field(
        default=None, description="Token de acesso para repositórios privados"
    )
    custom_prompt: str = Field(
        ...,
        description="Prompt customizado para a análise",
        min_length=10,
        max_length=2000,
    )

    class Config:
        json_schema_extra = {
            "example": {
                "github_url": "https://github.com/owner/repo",
                "branch": "main",
                "custom_prompt": "Quais são as principais vulnerabilidades de segurança neste código?",
            }
        }


# === Response Schemas ===


class AnalysisResponseSchema(BaseModel):
    """Schema de resposta da análise."""

    status: str = Field(..., description="Status da operação")
    analysis_type: str = Field(..., description="Tipo de análise realizada")
    repository_name: str = Field(..., description="Nome do repositório analisado")
    analysis: str = Field(..., description="Análise gerada pelo Gemini (Markdown)")
    tokens_used: int = Field(..., description="Tokens consumidos na geração")
    model: str = Field(..., description="Modelo de IA utilizado")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "analysis_type": "onboarding",
                "repository_name": "owner/repo",
                "analysis": "## Visão Geral\n\nEste projeto é uma API REST moderna...",
                "tokens_used": 5000,
                "model": "gemini-2.0-flash",
            }
        }


class AnalysisErrorSchema(BaseModel):
    """Schema de erro na análise."""

    status: str = Field(default="error", description="Status de erro")
    detail: str = Field(..., description="Descrição do erro")
    error_code: Optional[str] = Field(None, description="Código do erro")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "error",
                "detail": "GEMINI_API_KEY não configurada",
                "error_code": "MISSING_API_KEY",
            }
        }


# === Schemas de Análise Detalhada ===


class OnboardingSectionSchema(BaseModel):
    """Seção do relatório de onboarding."""

    title: str = Field(..., description="Título da seção")
    content: str = Field(..., description="Conteúdo da seção em Markdown")
    priority: int = Field(
        default=5, description="Prioridade da seção (1-10, menor = mais importante)"
    )


class StructuredOnboardingSchema(BaseModel):
    """Onboarding estruturado em seções."""

    status: str
    repository_name: str
    sections: List[OnboardingSectionSchema]
    summary: str = Field(..., description="Resumo executivo")
    getting_started_steps: List[str] = Field(
        ..., description="Passos ordenados para começar"
    )
    key_files: List[str] = Field(
        ..., description="Arquivos importantes para ler primeiro"
    )
    tech_stack: Dict[str, str] = Field(..., description="Stack tecnológica com versões")
    tokens_used: int
    model: str


# === Schemas de Métricas ===


class AnalysisMetricsSchema(BaseModel):
    """Métricas da análise realizada."""

    extraction_time_ms: int = Field(..., description="Tempo de extração em ms")
    analysis_time_ms: int = Field(..., description="Tempo de análise IA em ms")
    total_time_ms: int = Field(..., description="Tempo total em ms")
    tokens_input: int = Field(..., description="Tokens de entrada")
    tokens_output: int = Field(..., description="Tokens de saída")
    files_analyzed: int = Field(..., description="Arquivos analisados")
    lines_of_code: int = Field(..., description="Linhas de código processadas")
