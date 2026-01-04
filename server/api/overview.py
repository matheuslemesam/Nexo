"""
API de Overview - Gera resumos analíticos de repositórios usando IA.
Combina extração de contexto com Gemini para criar onboarding inteligente.
"""

from fastapi import APIRouter, HTTPException, status

from models.basic import RepoRequest
from schemas.overview import OverviewResponseSchema
from services.extract import download_and_extract
from services.gemini import gemini_service


router = APIRouter(prefix="/overview", tags=["Overview IA"])


# Prompt otimizado para gerar overview de onboarding em HTML
OVERVIEW_PROMPT_TEMPLATE = """You are an expert in code analysis and technical communication.

LANGUAGE: Your ENTIRE output MUST be in ENGLISH. If the source content (README, description, etc.) is in Portuguese, Spanish, or any other language, you MUST TRANSLATE everything to English in your response. No exceptions.

Analyze the following repository and generate a **contextual overview** in pure HTML (to be rendered in React).

## Repository Information:
- **Name:** {repo_name}
- **Description:** {description}
- **Stars:** {stars} ⭐ | **Forks:** {forks} 🍴
- **Last Update:** {updated_at}

## Context Files (README, configs, etc.):
{context_payload}

---

## Your Task:
Generate a **clear and well-structured overview** in HTML, focused on the GENERAL CONTEXT of the project.
REMEMBER: Output must be 100% in English, translate any non-English content.

### HTML Structure (use semantic tags):

1. **Title and Introduction**
   - Use <h2> for the catchy title with emoji
   - Use <p> for a welcome paragraph explaining what the project is

2. **The Problem and the Solution**
   - Use <h3> for section subtitles
   - Use <p> for paragraphs explaining the problem and the solution

3. **Main Features**
   - Use <h3> for the section title
   - Use <ul> and <li> to list features with emojis

4. **Who Is This Project For?**
   - Use <h3> for the title
   - Use <p> to describe target audience and use cases

5. **Getting Started** (IF there is information about installation/usage)
   - Use <h3> for the title
   - Use <ol> and <li> for numbered steps
   - Only if there is clear information in README or configs

6. **Final Considerations**
   - Use <h3> for the title
   - Use <p> for closing

### IMPORTANT HTML formatting rules:
- Use <strong> for important bold text
- Use <em> for emphasis
- Use <code> for inline technical terms
- Use CSS classes for styling: class="overview-title", class="overview-section", class="feature-list", class="steps-list"
- DO NOT include <html>, <head>, <body> tags - only the internal content
- DO NOT use inline style attributes
- DO NOT list languages, frameworks, or technical libraries
- DO NOT show directory structure or folders
- DO NOT make technical architecture analysis
- FOCUS on general context, purpose, and project value
- Be informative but accessible (not too technical)
- Use emojis moderately to make it visually pleasant
- Base yourself ONLY on the provided data
- Return ONLY the HTML, without additional explanations or code blocks
- IMPORTANT: If the source content is in Portuguese, TRANSLATE everything to English in the final output
- All section titles, paragraphs, lists, and content must be in English
"""


@router.post(
    "/generate",
    status_code=status.HTTP_200_OK,
    response_model=OverviewResponseSchema,
    summary="Gera overview de onboarding",
    description="Extrai contexto do repositório e gera um resumo analítico usando Gemini.",
)
async def generate_overview(payload: RepoRequest):
    """
    Endpoint que combina extração de repositório com geração de overview via IA.

    1. Baixa e analisa o repositório (usa o serviço de extract)
    2. Monta um prompt otimizado com o contexto
    3. Chama o Gemini para gerar o overview em Markdown
    4. Retorna o resultado formatado
    """
    # 1. Extrai o contexto do repositório
    try:
        extract_result = await download_and_extract(
            github_url=payload.github_url,
            branch=payload.branch,
            token=payload.token,
        )
    except HTTPException as e:
        return OverviewResponseSchema(
            status="error",
            repository_name=payload.github_url,
            overview=None,
            error=f"Erro na extração: {e.detail}",
            usage=None,
            context_stats=None,
        )
    except Exception as e:
        return OverviewResponseSchema(
            status="error",
            repository_name=payload.github_url,
            overview=None,
            error=f"Erro inesperado na extração: {str(e)}",
            usage=None,
            context_stats=None,
        )

    # 2. Extrai informações para o prompt
    github_data = extract_result.get("github", {})
    metadata = github_data.get("metadata", {})

    repo_name = metadata.get("full_name", "Repositório")
    description = metadata.get("description") or "Sem descrição disponível"
    stars = metadata.get("stars", 0)
    forks = metadata.get("forks", 0)
    updated_at = metadata.get("updated_at", "N/A")

    # 3. Monta o prompt (simplificado, focado no contexto)
    prompt = OVERVIEW_PROMPT_TEMPLATE.format(
        repo_name=repo_name,
        description=description,
        stars=stars,
        forks=forks,
        updated_at=updated_at,
        context_payload=extract_result.get("payload", "Nenhum contexto extraído"),
    )

    # 4. Limita o prompt se necessário (Gemini tem limite de ~30k tokens input)
    max_prompt_chars = 100000  # ~25k tokens
    if len(prompt) > max_prompt_chars:
        # Trunca o payload de contexto
        excess = len(prompt) - max_prompt_chars
        original_payload = extract_result.get("payload", "")
        truncated_payload = original_payload[: len(original_payload) - excess - 500]
        truncated_payload += "\n\n... [CONTEXTO TRUNCADO POR LIMITE DE TAMANHO] ..."

        prompt = OVERVIEW_PROMPT_TEMPLATE.format(
            repo_name=repo_name,
            description=description,
            stars=stars,
            forks=forks,
            updated_at=updated_at,
            context_payload=truncated_payload,
        )

    # 5. Chama o Gemini
    gemini_result = await gemini_service.generate_content(
        prompt=prompt,
        max_output_tokens=4096,
        temperature=0.7,
        timeout=90.0,  # Timeout maior para respostas longas
    )

    # 6. Monta a resposta
    context_stats = {
        "files_analyzed": extract_result.get("file_stats", {}).get(
            "files_in_context", 0
        ),
        "total_chars": extract_result.get("payload_chars", 0),
        "estimated_tokens": extract_result.get("payload_chars", 0) // 4,
        "prompt_chars": len(prompt),
        "prompt_estimated_tokens": len(prompt) // 4,
    }

    if not gemini_result["success"]:
        return OverviewResponseSchema(
            status="error",
            repository_name=repo_name,
            overview=None,
            error=gemini_result["error"],
            usage=None,
            context_stats=context_stats,
        )

    return OverviewResponseSchema(
        status="success",
        repository_name=repo_name,
        overview=gemini_result["content"],
        error=None,
        usage=gemini_result.get("usage"),
        context_stats=context_stats,
    )
