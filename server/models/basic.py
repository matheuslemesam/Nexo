from pydantic import BaseModel
from typing import Optional

class RepoRequest(BaseModel):
    github_url: str
    branch: str = "main"
    token: Optional[str] = None  # Token opcional para repos privados