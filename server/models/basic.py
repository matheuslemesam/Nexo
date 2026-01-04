from pydantic import BaseModel
from typing import Optional

class RepoRequest(BaseModel):
    github_url: str
    branch: Optional[str] = None  # Se None, usa a branch padrão do repositório
    token: Optional[str] = None  # Token opcional para repos privados