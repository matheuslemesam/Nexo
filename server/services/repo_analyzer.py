"""
Quick repository analyzer for podcast generation
This is a simplified analyzer until the full AI agent is ready
"""

import httpx
from typing import Dict, Any, Optional
import re


async def analyze_github_repo(repo_url: str) -> Dict[str, Any]:
    """
    Analyze a GitHub repository and extract basic information
    
    Args:
        repo_url: GitHub repository URL
        
    Returns:
        Dictionary with repository analysis
    """
    # Extract owner and repo name from URL
    match = re.match(r'https?://github\.com/([^/]+)/([^/]+)', repo_url)
    if not match:
        raise ValueError("Invalid GitHub repository URL")
    
    owner, repo = match.groups()
    repo = repo.replace('.git', '')
    
    # Fetch repository data from GitHub API
    async with httpx.AsyncClient() as client:
        # Get basic repo info
        repo_response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}",
            headers={"Accept": "application/vnd.github.v3+json"}
        )
        
        if repo_response.status_code == 404:
            raise ValueError("Repository not found")
        
        repo_response.raise_for_status()
        repo_data = repo_response.json()
        
        # Get languages
        languages_response = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/languages",
            headers={"Accept": "application/vnd.github.v3+json"}
        )
        languages = list(languages_response.json().keys()) if languages_response.status_code == 200 else []
        
        # Get README (simplified)
        try:
            readme_response = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/readme",
                headers={"Accept": "application/vnd.github.v3+json"}
            )
            has_readme = readme_response.status_code == 200
        except:
            has_readme = False
    
    # Build analysis
    analysis = {
        "name": repo_data.get("name", repo),
        "description": repo_data.get("description") or "A GitHub repository",
        "primary_language": repo_data.get("language") or (languages[0] if languages else "Unknown"),
        "technologies": languages[:5],
        "architecture": _generate_architecture_description(repo_data, languages),
        "data_flow": _generate_data_flow_description(repo_data),
        "key_features": _extract_key_features(repo_data, has_readme),
        "file_structure": f"This project follows a standard {repo_data.get('language', 'code')} project structure with organized directories and files.",
        "dependencies": languages
    }
    
    return analysis


def _generate_architecture_description(repo_data: Dict, languages: list) -> str:
    """Generate architecture description based on repo data"""
    lang = repo_data.get("language", "")
    
    descriptions = {
        "Python": "This project likely follows a modular Python architecture, with clear separation between core logic, utilities, and interfaces. It may use frameworks like FastAPI or Flask for web services, with organized packages for different concerns.",
        "JavaScript": "This JavaScript project follows modern development practices, potentially using frameworks like React, Vue, or Node.js. The architecture emphasizes component-based design with clear separation of concerns.",
        "TypeScript": "This TypeScript project benefits from static typing and follows modern patterns with clear interfaces and type definitions. The architecture promotes maintainable and scalable code organization.",
        "Java": "This Java project follows object-oriented principles with clear class hierarchies and design patterns. It likely uses established frameworks and follows enterprise architecture patterns.",
        "Go": "This Go project follows idiomatic Go patterns with a focus on simplicity and performance. The architecture emphasizes concurrent programming and efficient resource usage."
    }
    
    return descriptions.get(lang, "This project follows modern software architecture principles with organized code structure and clear separation of concerns.")


def _generate_data_flow_description(repo_data: Dict) -> str:
    """Generate data flow description"""
    return "Data flows through well-defined layers in this application, ensuring proper separation between input handling, business logic, and data persistence. The system maintains clean boundaries between components for better maintainability."


def _extract_key_features(repo_data: Dict, has_readme: bool) -> list:
    """Extract key features from repository data"""
    features = []
    
    if repo_data.get("has_issues"):
        features.append("Issue tracking and project management")
    
    if repo_data.get("has_wiki"):
        features.append("Comprehensive documentation wiki")
    
    if has_readme:
        features.append("Detailed README documentation")
    
    if repo_data.get("stargazers_count", 0) > 10:
        features.append("Active community with multiple stars")
    
    if repo_data.get("open_issues_count", 0) > 0:
        features.append("Active development with ongoing improvements")
    
    # Default features
    if not features:
        features = [
            "Well-structured codebase",
            "Clear project organization",
            "Modern development practices"
        ]
    
    return features
