"""
API de repositórios salvos do usuário
"""

from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from schemas.saved_repo import (
    SaveRepoRequest,
    SavedRepoResponse,
    SavedRepoSummary,
    SavedRepoListSummaryResponse,
)
from schemas.user import UserResponse
from models.saved_repo import SavedRepoModel
from services.auth import get_current_user
from services.database import get_database


router = APIRouter(prefix="/repos", tags=["Repositórios Salvos"])


@router.post(
    "/save", response_model=SavedRepoResponse, status_code=status.HTTP_201_CREATED
)
async def save_repository(
    repo_data: SaveRepoRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Salva um repositório analisado no perfil do usuário.

    Se o repositório já existir (mesmo repo_url), atualiza os dados.
    """
    db = get_database()
    collection = db.saved_repos

    # Verifica se já existe
    existing_repo = await collection.find_one(
        {
            "user_id": current_user.id,
            "repo_url": repo_data.repo_url,
        }
    )

    repo_dict = SavedRepoModel.to_dict(
        user_id=current_user.id,
        repo_url=repo_data.repo_url,
        repo_name=repo_data.repo_name,
        repo_full_name=repo_data.repo_full_name,
        description=repo_data.description,
        stars=repo_data.stars,
        forks=repo_data.forks,
        language=repo_data.language,
        overview=repo_data.overview,
        podcast_url=repo_data.podcast_url,
        podcast_script=repo_data.podcast_script,
        repository_info=repo_data.repository_info,
        file_analysis=repo_data.file_analysis,
        dependencies=repo_data.dependencies,
    )

    if existing_repo:
        # Atualiza mantendo o created_at original
        repo_dict["created_at"] = existing_repo["created_at"]
        await collection.update_one({"_id": existing_repo["_id"]}, {"$set": repo_dict})
        repo_dict["_id"] = str(existing_repo["_id"])
    else:
        # Insere novo
        result = await collection.insert_one(repo_dict)
        repo_dict["_id"] = str(result.inserted_id)

    return SavedRepoResponse(**repo_dict)


@router.get("/list", response_model=SavedRepoListSummaryResponse)
async def list_saved_repositories(
    current_user: UserResponse = Depends(get_current_user),
    skip: int = 0,
    limit: int = 20,
):
    """
    Lista todos os repositórios salvos do usuário (resumido).
    """
    db = get_database()
    collection = db.saved_repos

    # Busca repositórios do usuário
    cursor = (
        collection.find({"user_id": current_user.id})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    repos = []
    async for repo in cursor:
        repo_summary = SavedRepoSummary(
            _id=str(repo["_id"]),
            repo_url=repo["repo_url"],
            repo_name=repo["repo_name"],
            repo_full_name=repo["repo_full_name"],
            description=repo.get("description"),
            stars=repo.get("stars", 0),
            forks=repo.get("forks", 0),
            language=repo.get("language"),
            has_overview=bool(repo.get("overview")),
            has_podcast=bool(repo.get("podcast_url")),
            created_at=repo["created_at"],
        )
        repos.append(repo_summary)

    # Conta total
    total = await collection.count_documents({"user_id": current_user.id})

    return SavedRepoListSummaryResponse(repos=repos, total=total)


@router.get("/{repo_id}", response_model=SavedRepoResponse)
async def get_saved_repository(
    repo_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Obtém detalhes completos de um repositório salvo.
    """
    db = get_database()
    collection = db.saved_repos

    try:
        obj_id = ObjectId(repo_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de repositório inválido",
        )

    repo = await collection.find_one(
        {
            "_id": obj_id,
            "user_id": current_user.id,
        }
    )

    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repositório não encontrado",
        )

    repo["_id"] = str(repo["_id"])
    return SavedRepoResponse(**repo)


@router.delete("/{repo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_repository(
    repo_id: str,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Remove um repositório salvo.
    """
    db = get_database()
    collection = db.saved_repos

    try:
        obj_id = ObjectId(repo_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de repositório inválido",
        )

    result = await collection.delete_one(
        {
            "_id": obj_id,
            "user_id": current_user.id,
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repositório não encontrado",
        )

    return None


@router.patch("/{repo_id}/podcast", response_model=SavedRepoResponse)
async def update_podcast_info(
    repo_id: str,
    podcast_url: str = None,
    podcast_script: str = None,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Atualiza informações de podcast de um repositório salvo.
    """
    db = get_database()
    collection = db.saved_repos

    try:
        obj_id = ObjectId(repo_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de repositório inválido",
        )

    update_data = {}
    if podcast_url is not None:
        update_data["podcast_url"] = podcast_url
    if podcast_script is not None:
        update_data["podcast_script"] = podcast_script

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum dado para atualizar",
        )

    from datetime import datetime

    update_data["updated_at"] = datetime.utcnow()

    result = await collection.update_one(
        {"_id": obj_id, "user_id": current_user.id}, {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repositório não encontrado",
        )

    repo = await collection.find_one({"_id": obj_id})
    repo["_id"] = str(repo["_id"])
    return SavedRepoResponse(**repo)
