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
OVERVIEW_PROMPT_TEMPLATE = """Você é um especialista em análise de código e comunicação técnica.

Analise o seguinte repositório e gere um **overview contextual** em HTML puro (para renderizar em React).

## Informações do Repositório:
- **Nome:** {repo_name}
- **Descrição:** {description}
- **Estrelas:** {stars} ⭐ | **Forks:** {forks} 🍴
- **Última Atualização:** {updated_at}

## Arquivos de Contexto (README, configs, etc.):
{context_payload}

---

## Sua Tarefa:
Gere um **overview claro e bem estruturado** em HTML, focado no CONTEXTO GERAL do projeto.

### Estrutura do HTML (use tags semânticas):

1. **Título e Introdução**
   - Use <h2> para o título chamativo com emoji
   - Use <p> para um parágrafo de boas-vindas explicando o que é o projeto

2. **O Problema e a Solução**
   - Use <h3> para subtítulos de seção
   - Use <p> para parágrafos explicando o problema e a solução

3. **Principais Funcionalidades**
   - Use <h3> para o título da seção
   - Use <ul> e <li> para listar funcionalidades com emojis

4. **Para Quem é Este Projeto?**
   - Use <h3> para o título
   - Use <p> para descrever público-alvo e casos de uso

5. **Como Começar** (SE houver informação sobre instalação/uso)
   - Use <h3> para o título
   - Use <ol> e <li> para passos numerados
   - Apenas se houver informação clara no README ou configs

6. **Considerações Finais**
   - Use <h3> para o título
   - Use <p> para fechamento

### Regras IMPORTANTES de formatação HTML:
- Use <strong> para texto em negrito importante
- Use <em> para ênfase
- Use <code> para termos técnicos inline
- Use classes CSS para estilização: class="overview-title", class="overview-section", class="feature-list", class="steps-list"
- NÃO inclua tags <html>, <head>, <body> - apenas o conteúdo interno
- NÃO use atributos style inline
- NÃO liste linguagens, frameworks ou bibliotecas técnicas
- NÃO mostre estrutura de diretórios ou pastas
- NÃO faça análise técnica de arquitetura
- FOQUE no contexto geral, propósito e valor do projeto
- Seja informativo mas acessível (não muito técnico)
- Use emojis com moderação para deixar visual agradável
- Baseie-se APENAS nos dados fornecidos
- Retorne APENAS o HTML, sem explicações adicionais ou blocos de código
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
        print(f"✅ Token GitHub encontrado (fonte: {'payload' if payload.token else '.env'})")
    else:
        print("❌ ERRO: Nenhum token GitHub configurado!")

    # === ETAPA 1: Extração do Repositório ===
    try:
        print(f"🚀 Iniciando extração de: {payload.github_url} (branch: {payload.branch})")
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
        "info": metadata,
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
    if not gemini_result.get('success'):
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
