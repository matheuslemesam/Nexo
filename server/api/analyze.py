"""
API de Análise de Projetos com IA.
Endpoints para análise detalhada e onboarding usando Gemini.

Utiliza resumo inteligente para reduzir tokens de ~500k para ~5k.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from models.basic import RepoRequest
from services.extract import download_and_extract
from services.gemini import GeminiService, SYSTEM_INSTRUCTION_ONBOARDING
from services.summarizer import create_optimized_prompt, RepositorySummarizer


router = APIRouter(prefix="/analyze", tags=["Análise IA"])


# === Request Models ===


class AnalyzeRequest(RepoRequest):
    """Request para análise de repositório."""

    analysis_type: str = Field(
        default="onboarding",
        description="Tipo de análise: 'onboarding' (completa) ou 'quick' (rápida)",
    )
    include_code: bool = Field(
        default=True,
        description="Se deve incluir o código fonte na análise (mais detalhado, mais tokens)",
    )


class CustomAnalysisRequest(RepoRequest):
    """Request para análise customizada."""

    custom_prompt: str = Field(
        ...,
        description="Prompt customizado para a análise",
        min_length=10,
        max_length=2000,
    )


# === Response Models ===


class AnalysisResponse(BaseModel):
    """Resposta da análise."""

    status: str = Field(..., description="Status da operação")
    analysis_type: str = Field(..., description="Tipo de análise realizada")
    repository_name: str = Field(..., description="Nome do repositório analisado")
    analysis: str = Field(..., description="Análise gerada pelo Gemini (Markdown)")
    tokens_used: int = Field(..., description="Tokens consumidos")
    model: str = Field(..., description="Modelo utilizado")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "success",
                "analysis_type": "onboarding",
                "repository_name": "user/repo",
                "analysis": "## Visão Geral\n\nEste projeto é uma API REST...",
                "tokens_used": 5000,
                "model": "gemini-2.0-flash",
            }
        }


class QuickInsightsResponse(BaseModel):
    """Resposta de insights rápidos."""

    status: str
    repository: dict
    insights: str
    tokens_used: int


# === Endpoints ===


@router.post(
    "/onboarding",
    status_code=status.HTTP_200_OK,
    response_model=AnalysisResponse,
    summary="Análise de Onboarding Completa",
    description="""
    Extrai o repositório e gera uma análise completa de onboarding usando IA.
    
    A análise inclui:
    - Visão geral do projeto
    - Arquitetura e estrutura
    - Stack tecnológica
    - Guia de como começar
    - Arquivos importantes
    - Padrões e convenções
    - Pontos de atenção
    - Recursos adicionais
    
    **Atenção:** Esta operação pode levar alguns segundos devido ao processamento do Gemini.
    """,
)
async def analyze_onboarding(payload: AnalyzeRequest):
    """
    Gera análise de onboarding completa para um repositório.
    """
    try:
        # 1. Extrai informações do repositório
        extraction_result = await download_and_extract(
            github_url=payload.github_url, branch=payload.branch, token=payload.token
        )

        # 2. Cria resumo otimizado para economizar tokens
        optimized_prompt = create_optimized_prompt(extraction_result)
        repo_info = extraction_result["github"].get("metadata")

        # 3. Adiciona instrução de análise
        full_prompt = f"""
{optimized_prompt}

---

## 🎯 TAREFA: Análise de Onboarding

Baseado nas informações acima, gere uma análise completa de onboarding que inclua:

1. **Visão Geral** - O que é o projeto e qual problema resolve
2. **Arquitetura** - Como o projeto está estruturado
3. **Stack Tecnológica** - Tecnologias, frameworks e bibliotecas
4. **Como Começar** - Passos para configurar o ambiente de desenvolvimento
5. **Arquivos Importantes** - Onde encontrar o código principal
6. **Padrões e Convenções** - Estilo de código, organização
7. **Pontos de Atenção** - Possíveis melhorias ou problemas

Responda em português brasileiro de forma clara e bem formatada em Markdown.
"""

        # 4. Chama o Gemini
        gemini = GeminiService()
        response = await gemini.generate_content(
            prompt=full_prompt,
            system_instruction=SYSTEM_INSTRUCTION_ONBOARDING,
            temperature=0.7,
        )

        return AnalysisResponse(
            status="success",
            analysis_type=payload.analysis_type,
            repository_name=repo_info.get("full_name", payload.github_url)
            if repo_info
            else payload.github_url,
            analysis=response.content,
            tokens_used=response.tokens_used,
            model=response.model,
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar análise: {str(e)}",
        )


@router.post(
    "/quick",
    status_code=status.HTTP_200_OK,
    response_model=AnalysisResponse,
    summary="Análise Rápida",
    description="""
    Gera uma análise rápida do repositório sem incluir o código fonte completo.
    Mais rápido e consome menos tokens, ideal para uma visão geral inicial.
    """,
)
async def analyze_quick(payload: RepoRequest):
    """
    Gera análise rápida sem código fonte (menos tokens).
    """
    try:
        # 1. Extrai informações do repositório
        extraction_result = await download_and_extract(
            github_url=payload.github_url, branch=payload.branch, token=payload.token
        )

        # 2. Cria resumo otimizado
        try:
            optimized_prompt = create_optimized_prompt(extraction_result)
        except Exception as e:
            import traceback

            traceback.print_exc()
            raise ValueError(f"Erro ao criar resumo: {str(e)}")

        repo_info = (
            extraction_result.get("github", {}).get("metadata")
            if extraction_result.get("github")
            else None
        )

        # 3. Prompt para análise rápida (mais conciso)
        quick_prompt = f"""
{optimized_prompt}

---

## 🎯 TAREFA: Análise Rápida

Forneça um resumo executivo do projeto em 3-4 parágrafos incluindo:
- O que é o projeto
- Principais tecnologias
- Como está organizado
- Próximos passos recomendados para começar

Seja conciso e direto. Responda em português brasileiro.
"""

        # 4. Chama o Gemini
        gemini = GeminiService()
        response = await gemini.generate_content(
            prompt=quick_prompt, temperature=0.5, max_tokens=2000
        )

        return AnalysisResponse(
            status="success",
            analysis_type="quick",
            repository_name=repo_info.get("full_name", payload.github_url)
            if repo_info
            else payload.github_url,
            analysis=response.content,
            tokens_used=response.tokens_used,
            model=response.model,
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        import traceback

        error_trace = traceback.format_exc()
        print(f"ERRO COMPLETO (analyze_quick):\n{error_trace}")  # Log no console
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar análise: {str(e)}",
        )


@router.post(
    "/custom",
    status_code=status.HTTP_200_OK,
    response_model=AnalysisResponse,
    summary="Análise Customizada",
    description="""
    Permite enviar um prompt customizado para analisar o repositório.
    Útil para perguntas específicas sobre o código.
    """,
)
async def analyze_custom(payload: CustomAnalysisRequest):
    """
    Gera análise com prompt customizado.
    """
    try:
        # 1. Extrai informações do repositório
        extraction_result = await download_and_extract(
            github_url=payload.github_url, branch=payload.branch, token=payload.token
        )

        # 2. Cria resumo otimizado
        optimized_prompt = create_optimized_prompt(extraction_result)
        repo_info = extraction_result["github"].get("metadata")

        # 3. Constrói prompt com contexto otimizado + pergunta do usuário
        full_prompt = f"""
{optimized_prompt}

---

## 🎯 SOLICITAÇÃO DO USUÁRIO

{payload.custom_prompt}

---

Responda em português brasileiro de forma clara e detalhada.
"""

        # 4. Chama o Gemini
        gemini = GeminiService()
        response = await gemini.generate_content(prompt=full_prompt, temperature=0.6)

        return AnalysisResponse(
            status="success",
            analysis_type="custom",
            repository_name=repo_info.get("full_name", payload.github_url)
            if repo_info
            else payload.github_url,
            analysis=response.content,
            tokens_used=response.tokens_used,
            model=response.model,
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar análise: {str(e)}",
        )


@router.post(
    "/readme",
    status_code=status.HTTP_200_OK,
    response_model=AnalysisResponse,
    summary="Gerar README",
    description="Gera um README.md completo e bem estruturado para o repositório.",
)
async def generate_readme(payload: RepoRequest):
    """
    Gera um README.md profissional para o projeto.
    """
    try:
        # 1. Extrai informações do repositório
        extraction_result = await download_and_extract(
            github_url=payload.github_url, branch=payload.branch, token=payload.token
        )

        # 2. Cria resumo otimizado
        optimized_prompt = create_optimized_prompt(extraction_result)
        repo_info = extraction_result["github"].get("metadata")

        # 3. Constrói prompt específico para README
        readme_prompt = f"""
{optimized_prompt}

---

## 🎯 TAREFA: Gerar README.md Profissional

Baseado nas informações acima, gere um README.md completo que inclua:

1. **Título e Badges** (build status, versão, licença - use placeholders se necessário)
2. **Descrição** clara e concisa do projeto
3. **Features/Funcionalidades** principais
4. **Screenshots/Demo** (placeholder se aplicável)
5. **Tecnologias Utilizadas** com ícones/badges
6. **Pré-requisitos** para rodar o projeto
7. **Instalação** passo a passo
8. **Configuração** (variáveis de ambiente, etc.)
9. **Como Usar** com exemplos de comandos
10. **Estrutura do Projeto** (árvore de diretórios simplificada)
11. **API Documentation** (se aplicável)
12. **Contribuição** guidelines
13. **Licença**
14. **Contato/Autores**

Use Markdown formatado corretamente. Seja profissional e detalhado.
Retorne APENAS o conteúdo do README.md, sem explicações adicionais.
"""

        # 4. Chama o Gemini
        gemini = GeminiService()
        response = await gemini.generate_content(
            prompt=readme_prompt,
            system_instruction="Você é um especialista em documentação de projetos open source. Gere READMEs profissionais e bem estruturados em Markdown.",
            temperature=0.6,
        )

        return AnalysisResponse(
            status="success",
            analysis_type="readme",
            repository_name=repo_info.get("full_name", payload.github_url)
            if repo_info
            else payload.github_url,
            analysis=response.content,
            tokens_used=response.tokens_used,
            model=response.model,
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao gerar README: {str(e)}",
        )
