"""
Módulo para interação com a API do GitHub.
Responsável por buscar metadados do repositório.
"""

import httpx
from typing import Optional
from dataclasses import dataclass


@dataclass
class RepoMetadata:
    """Metadados do repositório obtidos via API do GitHub."""

    name: str
    full_name: str
    description: Optional[str]
    stars: int
    forks: int
    open_issues: int
    watchers: int
    default_branch: str
    language: Optional[str]
    created_at: str
    updated_at: str
    size_kb: int
    is_private: bool
    topics: list[str]


@dataclass
class Contributor:
    """Informações de um contribuidor."""

    username: str
    avatar_url: str
    contributions: int
    profile_url: str


@dataclass
class BranchInfo:
    """Informações sobre branches do repositório."""

    name: str
    is_protected: bool


class GitHubAPIService:
    """Serviço para interagir com a API REST do GitHub."""

    BASE_URL = "https://api.github.com"

    def __init__(self, token: Optional[str] = None):
        self.headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        if token:
            self.headers["Authorization"] = f"Bearer {token}"

    def _parse_repo_url(self, github_url: str) -> tuple[str, str]:
        """
        Extrai owner e repo_name de uma URL do GitHub.
        Ex: https://github.com/owner/repo -> (owner, repo)
        """
        clean_url = github_url.rstrip("/").replace(".git", "")
        parts = clean_url.split("/")

        # Espera formato: https://github.com/owner/repo
        if len(parts) < 5 or "github.com" not in clean_url:
            raise ValueError(
                "URL do GitHub inválida. Use o formato: https://github.com/owner/repo"
            )

        owner = parts[-2]
        repo = parts[-1]
        return owner, repo

    async def get_repo_metadata(self, github_url: str) -> RepoMetadata:
        """Busca metadados básicos do repositório."""
        owner, repo = self._parse_repo_url(github_url)
        url = f"{self.BASE_URL}/repos/{owner}/{repo}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)

            if response.status_code == 404:
                raise ValueError(
                    "Repositório não encontrado ou sem permissão de acesso."
                )
            if response.status_code == 403:
                raise ValueError(
                    "Rate limit excedido ou acesso negado. Tente usar um token."
                )
            if response.status_code != 200:
                raise ValueError(
                    f"Erro ao acessar API do GitHub: {response.status_code}"
                )

            data = response.json()

            return RepoMetadata(
                name=data.get("name", ""),
                full_name=data.get("full_name", ""),
                description=data.get("description"),
                stars=data.get("stargazers_count", 0),
                forks=data.get("forks_count", 0),
                open_issues=data.get("open_issues_count", 0),
                watchers=data.get("watchers_count", 0),
                default_branch=data.get("default_branch", "main"),
                language=data.get("language"),
                created_at=data.get("created_at", ""),
                updated_at=data.get("updated_at", ""),
                size_kb=data.get("size", 0),
                is_private=data.get("private", False),
                topics=data.get("topics", []),
            )

    async def get_contributors(
        self, github_url: str, limit: int = 10
    ) -> list[Contributor]:
        """Busca os principais contribuidores do repositório."""
        owner, repo = self._parse_repo_url(github_url)
        url = f"{self.BASE_URL}/repos/{owner}/{repo}/contributors"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url, headers=self.headers, params={"per_page": limit}
            )

            if response.status_code != 200:
                return []  # Retorna lista vazia se falhar (não é crítico)

            data = response.json()

            return [
                Contributor(
                    username=c.get("login", ""),
                    avatar_url=c.get("avatar_url", ""),
                    contributions=c.get("contributions", 0),
                    profile_url=c.get("html_url", ""),
                )
                for c in data
            ]

    async def get_branches(self, github_url: str) -> list[BranchInfo]:
        """Busca informações sobre as branches do repositório."""
        owner, repo = self._parse_repo_url(github_url)
        url = f"{self.BASE_URL}/repos/{owner}/{repo}/branches"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=self.headers,
                params={"per_page": 100},  # Máximo permitido
            )

            if response.status_code != 200:
                return []

            data = response.json()

            return [
                BranchInfo(
                    name=b.get("name", ""), is_protected=b.get("protected", False)
                )
                for b in data
            ]

    async def get_languages(self, github_url: str) -> dict[str, int]:
        """Busca estatísticas de linguagens do repositório (bytes por linguagem)."""
        owner, repo = self._parse_repo_url(github_url)
        url = f"{self.BASE_URL}/repos/{owner}/{repo}/languages"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)

            if response.status_code != 200:
                return {}

            return response.json()
