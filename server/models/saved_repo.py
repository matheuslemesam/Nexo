"""
Modelo de repositório salvo para MongoDB
"""

from datetime import datetime
from typing import Optional, List, Dict, Any


class SavedRepoModel:
    """Representação do repositório salvo no MongoDB."""

    @staticmethod
    def to_dict(
        user_id: str,
        repo_url: str,
        repo_name: str,
        repo_full_name: str,
        description: Optional[str] = None,
        stars: int = 0,
        forks: int = 0,
        language: Optional[str] = None,
        overview: Optional[str] = None,
        podcast_url: Optional[str] = None,
        podcast_script: Optional[str] = None,
        repository_info: Optional[Dict[str, Any]] = None,
        file_analysis: Optional[Dict[str, Any]] = None,
        dependencies: Optional[List[Dict[str, Any]]] = None,
        created_at: Optional[datetime] = None,
    ) -> dict:
        """Converte para dicionário do MongoDB."""
        return {
            "user_id": user_id,
            "repo_url": repo_url,
            "repo_name": repo_name,
            "repo_full_name": repo_full_name,
            "description": description,
            "stars": stars,
            "forks": forks,
            "language": language,
            "overview": overview,
            "podcast_url": podcast_url,
            "podcast_script": podcast_script,
            "repository_info": repository_info,
            "file_analysis": file_analysis,
            "dependencies": dependencies or [],
            "created_at": created_at or datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

    @staticmethod
    def from_dict(data: dict) -> dict:
        """Converte documento MongoDB para dict de resposta."""
        if data and "_id" in data:
            data["_id"] = str(data["_id"])
        return data
