"""
API endpoints para recursos de aprendizado baseados em tecnologias.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from schemas.learning import LearningResourcesResponse
from services.learning_service import generate_learning_resources

router = APIRouter(tags=["Learning Resources"])


@router.get("/learning-resources", response_model=LearningResourcesResponse)
async def get_learning_resources(
    technologies: str = Query(
        ...,
        description="Lista de tecnologias separadas por vírgula (ex: 'TypeScript,React,Node.js')",
        example="TypeScript,React,FastAPI",
    ),
    repo_context: Optional[str] = Query(
        None,
        description="Contexto adicional sobre o repositório para melhorar as sugestões",
        max_length=500,
    ),
):
    """
    Gera recursos de aprendizado personalizados baseados nas tecnologias detectadas.

    Este endpoint usa IA para gerar:
    - Resumo técnico de cada tecnologia
    - Links para documentação oficial
    - Artigos e guias técnicos
    - Vídeos tutoriais de qualidade

    Args:
        technologies: Tecnologias detectadas (separadas por vírgula)
        repo_context: Contexto opcional do repositório

    Returns:
        LearningResourcesResponse: Recursos de aprendizado organizados por tecnologia
    """
    # Parse das tecnologias
    tech_list = [tech.strip() for tech in technologies.split(",") if tech.strip()]

    if not tech_list:
        raise HTTPException(
            status_code=400,
            detail="Pelo menos uma tecnologia deve ser fornecida",
        )

    if len(tech_list) > 15:
        raise HTTPException(
            status_code=400,
            detail="Máximo de 15 tecnologias por requisição",
        )

    try:
        # Gera recursos de aprendizado
        print(f"🎓 Gerando recursos de aprendizado para: {tech_list}")
        result = await generate_learning_resources(
            technologies=tech_list,
            repo_context=repo_context or "",
        )
        print(f"✅ Recursos gerados com sucesso!")
        print(f"📦 Tipo do resultado: {type(result)}")
        print(f"📦 Keys do resultado: {result.keys() if isinstance(result, dict) else 'N/A'}")
        print(f"📦 Quantidade de recursos: {len(result.get('learning_resources', [])) if isinstance(result, dict) else 'N/A'}")

        # Verifica se houve erro
        if "error" in result and not result["learning_resources"]:
            print(f"❌ Erro nos recursos: {result['error']}")
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao gerar recursos de aprendizado: {result['error']}",
            )

        return LearningResourcesResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERRO INESPERADO no learning endpoint: {str(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro inesperado ao processar requisição: {str(e)}",
        )
