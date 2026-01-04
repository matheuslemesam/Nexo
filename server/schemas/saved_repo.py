"""
Schemas de validação para repositórios salvos
"""

from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel, Field


class SaveRepoRequest(BaseModel):
    """Schema para salvar um repositório."""

    repo_url: str = Field(..., description="URL do repositório GitHub")
    repo_name: str = Field(..., description="Nome do repositório")
    repo_full_name: str = Field(..., description="Nome completo (owner/repo)")
    description: Optional[str] = Field(None, description="Descrição do repositório")
    stars: int = Field(0, description="Número de estrelas")
    forks: int = Field(0, description="Número de forks")
    language: Optional[str] = Field(None, description="Linguagem principal")
    overview: Optional[str] = Field(None, description="Overview gerado pela IA")
    podcast_url: Optional[str] = Field(None, description="URL do podcast gerado")
    podcast_script: Optional[str] = Field(None, description="Script do podcast")
    repository_info: Optional[Dict[str, Any]] = Field(
        None, description="Informações do repositório"
    )
    file_analysis: Optional[Dict[str, Any]] = Field(
        None, description="Análise de arquivos"
    )
    dependencies: Optional[List[Dict[str, Any]]] = Field(
        None, description="Dependências"
    )


class SavedRepoResponse(BaseModel):
    """Schema de resposta de repositório salvo."""

    id: str = Field(..., alias="_id")
    user_id: str
    repo_url: str
    repo_name: str
    repo_full_name: str
    description: Optional[str] = None
    stars: int = 0
    forks: int = 0
    language: Optional[str] = None
    overview: Optional[str] = None
    podcast_url: Optional[str] = None
    podcast_script: Optional[str] = None
    repository_info: Optional[Dict[str, Any]] = None
    file_analysis: Optional[Dict[str, Any]] = None
    dependencies: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


class SavedRepoListResponse(BaseModel):
    """Schema de resposta para lista de repositórios salvos."""

    repos: List[SavedRepoResponse]
    total: int


class SavedRepoSummary(BaseModel):
    """Schema resumido para lista de repositórios."""

    id: str = Field(..., alias="_id")
    repo_url: str
    repo_name: str
    repo_full_name: str
    description: Optional[str] = None
    stars: int = 0
    forks: int = 0
    language: Optional[str] = None
    has_overview: bool = False
    has_podcast: bool = False
    created_at: datetime

    class Config:
        populate_by_name = True


class SavedRepoListSummaryResponse(BaseModel):
    """Schema de resposta para lista resumida de repositórios."""

    repos: List[SavedRepoSummary]
    total: int
