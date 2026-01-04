"""
Schemas para recursos de aprendizado baseados em tecnologias detectadas.
"""

from typing import List, Literal
from pydantic import BaseModel, Field, HttpUrl


class LearningResource(BaseModel):
    """Um recurso de aprendizado individual."""

    type: Literal["docs", "article", "video"] = Field(
        ..., description="Tipo do recurso"
    )
    title: str = Field(..., description="Título do recurso")
    url: str = Field(..., description="URL do recurso")
    description: str = Field(..., description="Breve descrição do recurso")


class TechnologyLearningResource(BaseModel):
    """Recursos de aprendizado para uma tecnologia específica."""

    technology: str = Field(..., description="Nome da tecnologia")
    icon: str = Field(..., description="Emoji representando a tecnologia")
    color: str = Field(..., description="Cor hexadecimal da tecnologia")
    summary: str = Field(
        ...,
        description="Resumo rápido sobre o que é essa tecnologia e para que serve",
    )
    resources: List[LearningResource] = Field(
        ..., description="Lista de recursos de aprendizado"
    )


class LearningResourcesResponse(BaseModel):
    """Resposta com todos os recursos de aprendizado."""

    learning_resources: List[TechnologyLearningResource] = Field(
        ..., description="Lista de recursos organizados por tecnologia"
    )
    detected_technologies: List[str] = Field(
        ..., description="Lista de tecnologias detectadas no repositório"
    )
