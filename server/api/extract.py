from fastapi import APIRouter, Depends, status

from models.basic import RepoRequest
from services.extract import download_and_extract


router = APIRouter(prefix="/extract", tags=["Extração"])


@router.post("/context", status_code=status.HTTP_200_OK)
async def extract_repo_context(payload: RepoRequest):
    """
    Recebe URL do GitHub, baixa o ZIP, filtra arquivos e retorna string formatada.
    Suporta repositórios privados via token.
    """
    # Chama o serviço (Service Layer)
    result = await download_and_extract(
        github_url=payload.github_url, branch=payload.branch, token=payload.token
    )

    # Aqui você poderia chamar o Gemini diretamente ou retornar para o frontend
    return {
        "status": "success",
        "meta": {
            "files_read": result["files_processed"],
            "total_chars": result["repo_size_chars"],
            "estimated_tokens": int(
                result["repo_size_chars"] / 4
            ),  # Estimativa grosseira
        },
        "context_payload": result["payload"],
    }
