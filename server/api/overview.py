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


# Prompt otimizado para gerar overview de onboarding
OVERVIEW_PROMPT_TEMPLATE = """Você é um especialista em análise de código e comunicação técnica.

Analise o seguinte repositório e gere um **overview contextual** em Markdown.

## Informações do Repositório:
- **Nome:** {repo_name}
- **Descrição:** {description}
- **Estrelas:** {stars} ⭐ | **Forks:** {forks} 🍴
- **Última Atualização:** {updated_at}

## Arquivos de Contexto (README, configs, etc.):
{context_payload}

---

## Sua Tarefa:
Gere um **overview claro e bem estruturado** em Markdown, focado no CONTEXTO GERAL do projeto.

### Estrutura do texto (use parágrafos bem separados):

1. **Título e Introdução**
   - Um título chamativo com emoji
   - Um parágrafo de boas-vindas explicando o que é o projeto de forma envolvente

2. **O Problema e a Solução**
   - Um parágrafo explicando qual problema o projeto resolve
   - Um parágrafo explicando COMO ele resolve (a abordagem/solução)

3. **Principais Funcionalidades**
   - Liste as funcionalidades principais em formato de lista com emojis
   - Seja específico sobre o que cada feature faz

4. **Para Quem é Este Projeto?**
   - Um parágrafo descrevendo o público-alvo
   - Casos de uso típicos

5. **Como Começar** (SE houver informação sobre instalação/uso)
   - Passos simples para usar o projeto
   - Apenas se houver informação clara no README ou configs

6. **Considerações Finais**
   - Um parágrafo de fechamento
   - Pode incluir status do projeto, próximos passos ou convite para contribuir

### Regras IMPORTANTES:
- NÃO liste linguagens, frameworks ou bibliotecas técnicas
- NÃO mostre estrutura de diretórios ou pastas
- NÃO faça análise técnica de arquitetura
- FOQUE no contexto geral, propósito e valor do projeto
- Use parágrafos bem separados e fluidos
- Seja informativo mas acessível (não muito técnico)
- Use emojis com moderação para deixar visual agradável
- Baseie-se APENAS nos dados fornecidos
- Retorne APENAS o Markdown, sem explicações adicionais
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
