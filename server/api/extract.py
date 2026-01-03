from fastapi import APIRouter, Depends, status

from models.basic import RepoRequest
from schemas.extract import ExtractResponseSchema
from services.extract import download_and_extract


router = APIRouter(prefix="/extract", tags=["Extração"])


@router.post(
    "/context", status_code=status.HTTP_200_OK, response_model=ExtractResponseSchema
)
async def extract_repo_context(payload: RepoRequest):
    """
    Recebe URL do GitHub, baixa o ZIP, filtra arquivos e retorna informações completas.

    Retorna:
    - Metadados do repositório (estrelas, forks, issues, etc.)
    - Lista de contribuidores
    - Informações de branches
    - Estatísticas de linguagens
    - Contagem de arquivos por categoria (code, assets, config, etc.)
    - Dependências detectadas
    - Estrutura de diretórios
    - Payload de contexto para análise IA
    """
    # Chama o serviço (Service Layer)
    result = await download_and_extract(
        github_url=payload.github_url, branch=payload.branch, token=payload.token
    )

    # Monta resposta enriquecida
    return {
        "status": "success",
        # Metadados do GitHub
        "repository": {
            "info": result["github"]["metadata"],
            "contributors": result["github"]["contributors"],
            "branches": {
                "count": result["github"]["branch_count"],
                "list": result["github"]["branches"],
            },
            "languages": result["github"]["languages"],
        },
        # Estatísticas de arquivos
        "file_analysis": {
            "summary": {
                "total_files": result["file_stats"]["total_files"],
                "total_lines": result["file_stats"]["total_lines"],
                "total_size": result["file_stats"]["total_size_human"],
            },
            "by_category": result["file_stats"]["by_category"],
            "top_extensions": result["file_stats"]["by_extension"],
        },
        # Dependências
        "dependencies": result["dependencies"],
        # Estrutura de pastas
        "directory_structure": result["directory_structure"],
        # Contexto para IA
        "context": {
            "payload": result["payload"],
            "total_chars": result["payload_chars"],
            "estimated_tokens": int(result["payload_chars"] / 4),
        },
        # Erros (se houver)
        "errors": result["errors"],
    }
