"""
Serviço de integração com o Google Gemini AI.
Responsável por gerar análises e insights de projetos.
"""

import json
import asyncio
import httpx
import re
from typing import Optional
from dataclasses import dataclass

from core.config import settings


@dataclass
class GeminiResponse:
    """Resposta do Gemini."""

    content: str
    tokens_used: int
    model: str


class GeminiService:
    """Serviço para interagir com a API do Google Gemini."""

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    # Modelos alternativos para fallback (em ordem de preferência)
    # Atualizados para os modelos disponíveis em 2026
    FALLBACK_MODELS = [
        "gemini-2.0-flash-lite",  # Mais leve, menor consumo de quota
        "gemini-2.0-flash",  # Equilibrado
        "gemini-2.5-flash",  # Mais novo
    ]

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL

        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY não configurada. "
                "Adicione ao arquivo .env ou passe como parâmetro."
            )

    async def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        max_tokens: int = None,
        temperature: float = 0.7,
        max_retries: int = 3,
    ) -> GeminiResponse:
        """
        Gera conteúdo usando o Gemini com retry automático.

        Args:
            prompt: O prompt principal para o modelo
            system_instruction: Instruções de sistema para guiar o comportamento
            max_tokens: Máximo de tokens na resposta
            temperature: Controle de criatividade (0.0 - 1.0)
            max_retries: Número máximo de tentativas em caso de rate limit

        Returns:
            GeminiResponse com o conteúdo gerado
        """
        # Lista de modelos para tentar (modelo principal + fallbacks)
        models_to_try = [self.model] + [
            m for m in self.FALLBACK_MODELS if m != self.model
        ]

        last_error = None

        for model in models_to_try:
            try:
                return await self._try_generate(
                    model=model,
                    prompt=prompt,
                    system_instruction=system_instruction,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    max_retries=max_retries,
                )
            except ValueError as e:
                last_error = e
                error_str = str(e)
                # Se for rate limit (429), tenta o próximo modelo
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    print(f"⚠️ Modelo {model} com rate limit, tentando próximo...")
                    continue
                # Se for outro erro, propaga
                raise

        # Se todos os modelos falharam
        raise ValueError(
            f"Todos os modelos estão com rate limit. "
            f"Aguarde alguns minutos e tente novamente. "
            f"Último erro: {last_error}"
        )

    async def _try_generate(
        self,
        model: str,
        prompt: str,
        system_instruction: Optional[str],
        max_tokens: Optional[int],
        temperature: float,
        max_retries: int,
    ) -> GeminiResponse:
        """Tenta gerar conteúdo com um modelo específico."""

        url = f"{self.BASE_URL}/models/{model}:generateContent"

        # Monta o corpo da requisição
        request_body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens or settings.GEMINI_MAX_TOKENS,
                "topP": 0.95,
                "topK": 40,
            },
        }

        # Adiciona system instruction se fornecida
        if system_instruction:
            request_body["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        for attempt in range(max_retries):
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    url,
                    params={"key": self.api_key},
                    json=request_body,
                    headers={"Content-Type": "application/json"},
                )

                if response.status_code == 200:
                    data = response.json()

                    # Extrai o conteúdo da resposta
                    try:
                        content = data["candidates"][0]["content"]["parts"][0]["text"]
                        tokens_used = data.get("usageMetadata", {}).get(
                            "totalTokenCount", 0
                        )
                    except (KeyError, IndexError) as e:
                        raise ValueError(f"Resposta inesperada do Gemini: {str(e)}")

                    return GeminiResponse(
                        content=content, tokens_used=tokens_used, model=model
                    )

                elif response.status_code == 429:
                    # Rate limit - extrai tempo de retry se disponível
                    error_text = response.text
                    retry_delay = self._extract_retry_delay(error_text)

                    if attempt < max_retries - 1:
                        wait_time = min(retry_delay or (2**attempt * 5), 60)
                        print(
                            f"⏳ Rate limit no modelo {model}. Aguardando {wait_time}s..."
                        )
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        # Última tentativa falhou, propaga para tentar outro modelo
                        raise ValueError(f"Rate limit no modelo {model}: {error_text}")

                else:
                    error_detail = response.text
                    raise ValueError(
                        f"Erro na API do Gemini ({response.status_code}): {error_detail}"
                    )

        raise ValueError(f"Máximo de tentativas excedido para modelo {model}")

    def _extract_retry_delay(self, error_text: str) -> Optional[int]:
        """Extrai o tempo de retry sugerido da mensagem de erro."""
        try:
            # Procura por padrões como "retry in 55.205722526s" ou "retryDelay": "55s"
            match = re.search(r"retry.*?(\d+(?:\.\d+)?)\s*s", error_text, re.IGNORECASE)
            if match:
                return int(float(match.group(1)))
        except:
            pass
        return None


# === Prompts para Análise de Projetos ===

SYSTEM_INSTRUCTION_ONBOARDING = """
Você é um especialista em análise de código e arquitetura de software. 
Sua função é analisar repositórios de código e fornecer um relatório de onboarding 
completo e detalhado para novos desenvolvedores.

Diretrizes:
- Seja objetivo e estruturado
- Use markdown para formatação
- Forneça exemplos práticos quando relevante
- Destaque pontos críticos e boas práticas
- Considere o contexto do projeto (linguagens, frameworks, tamanho)
- Escreva em português brasileiro

Formato de saída esperado:
Use seções claras com headers markdown (##, ###)
"""


def build_onboarding_prompt(
    repo_info: dict,
    file_analysis: dict,
    dependencies: list,
    directory_structure: dict,
    code_context: str,
    languages: dict,
) -> str:
    """
    Constrói o prompt para análise de onboarding.

    Args:
        repo_info: Metadados do repositório
        file_analysis: Estatísticas de arquivos
        dependencies: Lista de dependências
        directory_structure: Estrutura de diretórios
        code_context: Código fonte extraído
        languages: Estatísticas de linguagens

    Returns:
        Prompt formatado para o Gemini
    """
    # Formata informações do repositório
    repo_section = "## Informações do Repositório\n"
    if repo_info:
        repo_section += f"""
- **Nome:** {repo_info.get("name", "N/A")}
- **Descrição:** {repo_info.get("description", "Sem descrição")}
- **Linguagem Principal:** {repo_info.get("language", "N/A")}
- **Estrelas:** {repo_info.get("stars", 0)}
- **Forks:** {repo_info.get("forks", 0)}
- **Issues Abertas:** {repo_info.get("open_issues", 0)}
"""
    else:
        repo_section += "Informações não disponíveis.\n"

    # Formata linguagens
    languages_section = "## Linguagens Utilizadas\n"
    if languages:
        total_bytes = sum(languages.values())
        for lang, bytes_count in sorted(
            languages.items(), key=lambda x: x[1], reverse=True
        )[:10]:
            percentage = (bytes_count / total_bytes) * 100 if total_bytes > 0 else 0
            languages_section += f"- **{lang}:** {percentage:.1f}%\n"
    else:
        languages_section += "Não foi possível determinar as linguagens.\n"

    # Formata análise de arquivos
    files_section = "## Estatísticas de Arquivos\n"
    summary = file_analysis.get("summary", {})
    files_section += f"""
- **Total de Arquivos:** {summary.get("total_files", 0)}
- **Total de Linhas:** {summary.get("total_lines", 0)}
- **Tamanho Total:** {summary.get("total_size", "N/A")}

### Por Categoria:
"""
    for category, stats in file_analysis.get("by_category", {}).items():
        files_section += f"- **{category.title()}:** {stats.get('processed', 0)} arquivos, {stats.get('total_lines', 0)} linhas\n"

    # Formata dependências
    deps_section = "## Dependências\n"
    if dependencies:
        for dep in dependencies:
            deps_section += (
                f"\n### {dep.get('manager', 'N/A')} ({dep.get('file', '')})\n"
            )
            deps_section += f"- **Produção:** {', '.join(dep.get('dependencies', [])[:15]) or 'Nenhuma'}\n"
            if dep.get("dev_dependencies"):
                deps_section += f"- **Desenvolvimento:** {', '.join(dep.get('dev_dependencies', [])[:10])}\n"
    else:
        deps_section += "Nenhuma dependência detectada.\n"

    # Formata estrutura de diretórios (simplificada)
    structure_section = "## Estrutura de Diretórios\n```\n"
    structure_section += json.dumps(directory_structure, indent=2, ensure_ascii=False)[
        :2000
    ]
    structure_section += "\n```\n"

    # Monta o prompt completo
    prompt = f"""
Analise o seguinte projeto de software e gere um relatório de **Onboarding** completo.

{repo_section}

{languages_section}

{files_section}

{deps_section}

{structure_section}

## Código Fonte
<code_context>
{code_context[:100000]}
</code_context>

---

## Sua Análise Deve Incluir:

### 1. 📋 Visão Geral do Projeto
- O que o projeto faz?
- Qual problema ele resolve?
- Quem é o público-alvo?

### 2. 🏗️ Arquitetura e Estrutura
- Como o projeto está organizado?
- Quais são os principais módulos/componentes?
- Explique o fluxo de dados principal

### 3. 🛠️ Stack Tecnológica
- Frameworks e bibliotecas principais
- Por que essas escolhas fazem sentido?
- Versões importantes a considerar

### 4. 🚀 Como Começar (Getting Started)
- Pré-requisitos para rodar o projeto
- Passos para configuração do ambiente
- Comandos principais (build, run, test)

### 5. 📁 Arquivos Importantes
- Quais arquivos um novo dev deve ler primeiro?
- Onde estão as configurações principais?
- Pontos de entrada da aplicação

### 6. 🎯 Padrões e Convenções
- Padrões de código identificados
- Convenções de nomenclatura
- Estrutura de pastas seguida

### 7. ⚠️ Pontos de Atenção
- Áreas complexas que precisam de cuidado
- Débitos técnicos visíveis
- Possíveis melhorias

### 8. 📚 Recursos Adicionais
- Documentação recomendada
- Links úteis para as tecnologias usadas

Forneça uma análise detalhada, prática e útil para um desenvolvedor que está entrando no projeto.
"""

    return prompt


def build_quick_analysis_prompt(
    repo_info: dict, file_analysis: dict, dependencies: list, languages: dict
) -> str:
    """
    Constrói um prompt para análise rápida (sem código fonte completo).
    Útil para uma visão geral sem consumir muitos tokens.
    """
    prompt = f"""
Analise as seguintes informações de um repositório e forneça uma visão geral rápida:

## Repositório
- Nome: {repo_info.get("name", "N/A") if repo_info else "N/A"}
- Descrição: {repo_info.get("description", "N/A") if repo_info else "N/A"}
- Linguagem: {repo_info.get("language", "N/A") if repo_info else "N/A"}
- Estrelas: {repo_info.get("stars", 0) if repo_info else 0}

## Linguagens
{json.dumps(languages, indent=2) if languages else "N/A"}

## Arquivos
- Total: {file_analysis.get("summary", {}).get("total_files", 0)}
- Linhas: {file_analysis.get("summary", {}).get("total_lines", 0)}

## Dependências
{json.dumps([d.get("dependencies", [])[:10] for d in dependencies], indent=2) if dependencies else "N/A"}

---

Forneça em português:
1. **Tipo de Projeto:** (Web app, API, CLI, Library, etc.)
2. **Stack Principal:** (ex: React + Node.js + MongoDB)
3. **Complexidade Estimada:** (Baixa/Média/Alta)
4. **Resumo em 2-3 frases:** O que este projeto provavelmente faz?
5. **Próximos Passos Sugeridos:** O que um dev deveria fazer primeiro?
"""
    return prompt
