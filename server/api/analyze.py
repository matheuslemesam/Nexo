"""
API de Análise Unificada - Combina extração de dados e geração de overview em uma única chamada.
Evita redundância de chamadas ao serviço de extração.
"""

from fastapi import APIRouter, status

from models.basic import RepoRequest
from schemas.analyze import AnalyzeResponseSchema
from services.extract import download_and_extract
from services.gemini import gemini_service
from core.config import settings


router = APIRouter(prefix="/analyze", tags=["Análise Unificada"])


# Prompt otimizado para gerar overview de onboarding em HTML
OVERVIEW_PROMPT_TEMPLATE = """You are an expert in code analysis and technical communication.

⚠️ CRITICAL LANGUAGE REQUIREMENT: Your ENTIRE output MUST be in ENGLISH. If the source content (README, description, etc.) is in Portuguese, Spanish, or any other language, you MUST TRANSLATE everything to English in your response. No exceptions.

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
"""


@router.post(
    "/full",
    status_code=status.HTTP_200_OK,
    response_model=AnalyzeResponseSchema,
    summary="Análise completa do repositório",
    description="Extrai dados do repositório e gera overview com IA em uma única chamada.",
)
async def analyze_repository(payload: RepoRequest):
    """
    Endpoint unificado que:
    1. Baixa e analisa o repositório (extração de metadados, arquivos, etc.)
    2. Gera overview com IA usando o contexto extraído
    3. Retorna tudo em uma única resposta

    Benefícios:
    - Evita duplicação de chamadas ao serviço de extração
    - Reduz latência total (uma única requisição)
    - Mantém consistência dos dados
    """
    errors = []
    extract_result = None

    # Usa o token do payload ou o token do .env como fallback
    github_token = payload.token or settings.GITHUB_TOKEN

    # Log para debug
    if github_token:
        print(
            f"✅ Token GitHub encontrado (fonte: {'payload' if payload.token else '.env'})"
        )
    else:
        print("❌ ERRO: Nenhum token GitHub configurado!")

    # === ETAPA 1: Extração do Repositório ===
    try:
        print(
            f"🚀 Iniciando extração de: {payload.github_url} (branch: {payload.branch})"
        )
        extract_result = await download_and_extract(
            github_url=payload.github_url,
            branch=payload.branch,
            token=github_token,
        )
        print("✅ Extração concluída com sucesso!")
    except Exception as e:
        print(f"❌ ERRO na extração: {str(e)}")
        print(f"❌ Tipo do erro: {type(e).__name__}")
        import traceback

        print(f"❌ Traceback: {traceback.format_exc()}")
        return AnalyzeResponseSchema(
            status="error",
            repository=None,
            file_analysis=None,
            dependencies=[],
            directory_structure={},
            overview=None,
            overview_usage=None,
            context=None,
            errors=[f"Erro na extração: {str(e)}"],
            overview_error=None,
        )

    # === ETAPA 2: Montar dados de resposta da extração ===
    github_data = extract_result.get("github", {})
    metadata = github_data.get("metadata") or {}

    # Monta informações do repositório
    repository_info = {
        "info": metadata if metadata else None,
        "contributors": github_data.get("contributors", []),
        "branches": {
            "count": github_data.get("branch_count", 0),
            "list": github_data.get("branches", []),
        },
        "languages": github_data.get("languages", {}),
    }

    # Monta análise de arquivos
    file_stats = extract_result.get("file_stats") or {}
    file_analysis = {
        "summary": {
            "total_files": file_stats.get("total_files", 0),
            "total_lines": file_stats.get("total_lines", 0),
            "total_size": file_stats.get("total_size_human", "0 B"),
            "files_in_context": file_stats.get("files_in_context", 0),
            "total_analyzed": file_stats.get("total_files_analyzed", 0),
        },
        "by_category": file_stats.get("by_category", {}),
        "top_extensions": file_stats.get("by_extension", {}),
    }

    # Monta contexto
    context_info = {
        "payload": extract_result.get("payload", ""),
        "total_chars": extract_result.get("payload_chars", 0),
        "estimated_tokens": extract_result.get("payload_chars", 0) // 4,
        "max_chars": extract_result.get("payload_max_chars", 48000),
        "files_in_context": file_stats.get("files_in_context", 0),
        "total_analyzed": file_stats.get("total_files_analyzed", 0),
        "included_files": extract_result.get("included_files", []),
    }

    # Erros da extração
    if extract_result.get("errors"):
        errors.extend(extract_result["errors"])

    # === ETAPA 3: Geração do Overview com IA ===
    repo_name = metadata.get("full_name", "Repositório")
    description = metadata.get("description") or "Sem descrição disponível"
    stars = metadata.get("stars", 0)
    forks = metadata.get("forks", 0)
    updated_at = metadata.get("updated_at", "N/A")

    # Monta o prompt
    prompt = OVERVIEW_PROMPT_TEMPLATE.format(
        repo_name=repo_name,
        description=description,
        stars=stars,
        forks=forks,
        updated_at=updated_at,
        context_payload=extract_result.get("payload", "Nenhum contexto extraído"),
    )

    # Limita o prompt se necessário
    max_prompt_chars = 100000
    if len(prompt) > max_prompt_chars:
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

    # Chama o Gemini
    print(f"🤖 Chamando Gemini para gerar overview...")
    print(f"📊 Tamanho do prompt: {len(prompt)} caracteres")
    gemini_result = await gemini_service.generate_content(
        prompt=prompt,
        max_output_tokens=4096,
        temperature=0.7,
        timeout=90.0,
    )
    print(f"✅ Gemini respondeu: success={gemini_result.get('success')}")
    if not gemini_result.get("success"):
        print(f"❌ Erro do Gemini: {gemini_result.get('error')}")

    # Monta resultado do overview
    overview_content = None
    overview_usage = None
    overview_error = None

    if gemini_result["success"]:
        overview_content = gemini_result["content"]
        overview_usage = gemini_result.get("usage")
    else:
        overview_error = gemini_result.get(
            "error", "Erro desconhecido na geração do overview"
        )

    # === ETAPA 4: Determinar status final ===
    if overview_content and not errors:
        final_status = "success"
    elif overview_content or (repository_info.get("info") is not None):
        final_status = "partial"  # Tem dados, mas pode ter erros em alguma parte
    else:
        final_status = "error"

    return AnalyzeResponseSchema(
        status=final_status,
        repository=repository_info,
        file_analysis=file_analysis,
        dependencies=extract_result.get("dependencies", []),
        directory_structure=extract_result.get("directory_structure", {}),
        overview=overview_content,
        overview_usage=overview_usage,
        context=context_info,
        errors=errors if errors else None,
        overview_error=overview_error,
    )
