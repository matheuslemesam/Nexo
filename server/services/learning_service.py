"""
Serviço para gerar recursos de aprendizado baseados em tecnologias detectadas.
"""

import json
from typing import List, Dict, Any
from services.gemini import gemini_service


# Base de conhecimento de tecnologias comuns
TECH_DATABASE = {
    "typescript": {
        "icon": "📘",
        "color": "#3178c6",
        "aliases": ["ts", "typescript"],
    },
    "javascript": {
        "icon": "💛",
        "color": "#f7df1e",
        "aliases": ["js", "javascript", "node", "nodejs"],
    },
    "python": {"icon": "🐍", "color": "#3776ab", "aliases": ["py", "python"]},
    "react": {"icon": "⚛️", "color": "#61dafb", "aliases": ["react", "reactjs"]},
    "vue": {"icon": "💚", "color": "#42b883", "aliases": ["vue", "vuejs"]},
    "angular": {"icon": "🅰️", "color": "#dd0031", "aliases": ["angular", "ng"]},
    "fastapi": {"icon": "⚡", "color": "#009688", "aliases": ["fastapi"]},
    "django": {"icon": "🎸", "color": "#092e20", "aliases": ["django"]},
    "flask": {"icon": "🌶️", "color": "#000000", "aliases": ["flask"]},
    "express": {"icon": "🚂", "color": "#000000", "aliases": ["express", "expressjs"]},
    "docker": {"icon": "🐳", "color": "#2496ed", "aliases": ["docker"]},
    "kubernetes": {"icon": "☸️", "color": "#326ce5", "aliases": ["k8s", "kubernetes"]},
    "postgresql": {
        "icon": "🐘",
        "color": "#336791",
        "aliases": ["postgres", "postgresql", "psql"],
    },
    "mongodb": {"icon": "🍃", "color": "#47a248", "aliases": ["mongo", "mongodb"]},
    "redis": {"icon": "🔴", "color": "#dc382d", "aliases": ["redis"]},
    "rust": {"icon": "🦀", "color": "#ce422b", "aliases": ["rust", "rs"]},
    "go": {"icon": "🐹", "color": "#00add8", "aliases": ["go", "golang"]},
    "java": {"icon": "☕", "color": "#007396", "aliases": ["java"]},
    "spring": {"icon": "🍃", "color": "#6db33f", "aliases": ["spring", "springboot"]},
    "nextjs": {"icon": "▲", "color": "#000000", "aliases": ["next", "nextjs"]},
    "tailwind": {
        "icon": "🌊",
        "color": "#06b6d4",
        "aliases": ["tailwind", "tailwindcss"],
    },
    "graphql": {"icon": "◈", "color": "#e10098", "aliases": ["graphql"]},
    "aws": {"icon": "☁️", "color": "#ff9900", "aliases": ["aws", "amazon"]},
    "azure": {"icon": "☁️", "color": "#0078d4", "aliases": ["azure"]},
    "git": {"icon": "🔀", "color": "#f05032", "aliases": ["git"]},
}


def normalize_tech_name(tech: str) -> str:
    """Normaliza o nome de uma tecnologia."""
    tech_lower = tech.lower().strip()

    # Busca na base de conhecimento
    for canonical, data in TECH_DATABASE.items():
        if tech_lower in data["aliases"]:
            return canonical

    return tech_lower


def get_tech_metadata(tech: str) -> Dict[str, str]:
    """Retorna metadados de uma tecnologia (icon, color)."""
    normalized = normalize_tech_name(tech)

    if normalized in TECH_DATABASE:
        return {
            "icon": TECH_DATABASE[normalized]["icon"],
            "color": TECH_DATABASE[normalized]["color"],
        }

    # Fallback para tecnologias desconhecidas
    return {"icon": "📦", "color": "#6b7280"}


async def generate_learning_resources(
    technologies: List[str], repo_context: str = ""
) -> Dict[str, Any]:
    """
    Gera recursos de aprendizado para as tecnologias detectadas.

    Args:
        technologies: Lista de tecnologias detectadas
        repo_context: Contexto adicional sobre o repositório

    Returns:
        Dict com learning_resources e detected_technologies
    """
    if not technologies:
        return {"learning_resources": [], "detected_technologies": []}

    # Limita a 10 tecnologias para não sobrecarregar
    technologies = technologies[:10]

    prompt = f"""You are a software development and technical education expert.

Language: Your ENTIRE response MUST be in ENGLISH. If any source content is in Portuguese or another language, TRANSLATE everything to English.

Technologies detected in the repository: {", ".join(technologies)}
{f"Repository context: {repo_context}" if repo_context else ""}

For EACH technology listed above, generate:

1. **summary**: A technical and objective summary (2-3 sentences) explaining:
   - What the technology is
   - What it is used for
   - Main use case

2. **resources**: Exactly 3 REAL and UP-TO-DATE learning resources:
   - 1 official documentation (type: "docs")
   - 1 reputable technical article/guide (type: "article")  
   - 1 quality video tutorial (type: "video")

For each resource, provide:
- type: "docs", "article" or "video"
- title: Real title of the resource
- url: Real and functional URL
- description: Brief description (1 sentence)

IMPORTANT:
- Use real and up-to-date URLs (official documentation, well-known articles, YouTube videos)
- Prioritize reliable and current sources
- For videos, use reputable channels (freeCodeCamp, Traversy Media, Fireship, etc.)
- Be accurate with titles and URLs
- ALL content MUST be in English

Return ONLY valid JSON in the following format:
{{
  "technologies": [
    {{
      "technology": "Technology Name",
      "summary": "Technical summary...",
      "resources": [
        {{
          "type": "docs",
          "title": "Real title",
          "url": "https://...",
          "description": "Brief description"
        }},
        {{
          "type": "article",
          "title": "Real title",
          "url": "https://...",
          "description": "Brief description"
        }},
        {{
          "type": "video",
          "title": "Real title",
          "url": "https://...",
          "description": "Brief description"
        }}
      ]
    }}
  ]
}}

Generate for ALL technologies: {", ".join(technologies)}"""

    # Chama o Gemini
    result = await gemini_service.generate_content(
        prompt=prompt,
        max_output_tokens=8192,
        temperature=0.3,  # Baixa temperatura para respostas mais consistentes
        timeout=90.0,
    )

    if not result["success"]:
        # Fallback em caso de erro
        print(f"❌ Gemini falhou: {result['error']}")
        return {
            "learning_resources": [],
            "detected_technologies": technologies,
            "error": result["error"],
        }

    try:
        # Parse do JSON retornado pela IA
        content = result["content"].strip()
        print(f"📄 Conteúdo bruto do Gemini (primeiros 500 chars): {content[:500]}")

        # Remove markdown code blocks se existirem
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]

        content = content.strip()

        print(f"📄 Conteúdo limpo (primeiros 500 chars): {content[:500]}")
        data = json.loads(content)
        print(
            f"✅ JSON parseado com sucesso! {len(data.get('technologies', []))} tecnologias"
        )

        # Adiciona metadados (icon, color) para cada tecnologia
        learning_resources = []
        for tech_data in data.get("technologies", []):
            tech_name = tech_data.get("technology", "")
            metadata = get_tech_metadata(tech_name)

            learning_resources.append(
                {
                    "technology": tech_name,
                    "icon": metadata["icon"],
                    "color": metadata["color"],
                    "summary": tech_data.get("summary", ""),
                    "resources": tech_data.get("resources", []),
                }
            )

        return {
            "learning_resources": learning_resources,
            "detected_technologies": technologies,
        }

    except json.JSONDecodeError as e:
        # Fallback: retorna vazio se não conseguir parsear
        print(f"❌ Erro ao parsear JSON: {str(e)}")
        print(f"❌ Conteúdo que falhou: {content[:1000]}")
        return {
            "learning_resources": [],
            "detected_technologies": technologies,
            "error": f"Erro ao parsear resposta da IA: {str(e)}",
        }
    except Exception as e:
        print(f"❌ Erro inesperado ao processar: {str(e)}")
        import traceback

        print(f"❌ Traceback: {traceback.format_exc()}")
        return {
            "learning_resources": [],
            "detected_technologies": technologies,
            "error": f"Erro inesperado: {str(e)}",
        }
