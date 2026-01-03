"""
Serviço de integração com a API do Google Gemini.
Gerencia chamadas assíncronas com controle de timeout e tamanho.
"""

import httpx
import asyncio
from typing import Optional
from core.config import settings


class GeminiService:
    """Serviço para interação com a API do Gemini."""

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.max_tokens = settings.GEMINI_MAX_TOKENS

    async def generate_content(
        self,
        prompt: str,
        max_output_tokens: int = 4096,
        temperature: float = 0.7,
        timeout: float = 60.0,
    ) -> dict:
        """
        Gera conteúdo usando o Gemini API.

        Args:
            prompt: O prompt para enviar ao modelo
            max_output_tokens: Máximo de tokens na resposta
            temperature: Criatividade (0.0 a 1.0)
            timeout: Timeout em segundos

        Returns:
            Dict com 'success', 'content' ou 'error'
        """
        if not self.api_key:
            return {
                "success": False,
                "error": "GEMINI_API_KEY não configurada",
                "content": None,
            }

        url = f"{self.BASE_URL}/{self.model}:generateContent?key={self.api_key}"

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens,
                "topP": 0.95,
                "topK": 40,
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_NONE",
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_NONE",
                },
            ],
        }

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(url, json=payload)

                if response.status_code != 200:
                    error_data = response.json() if response.content else {}
                    error_msg = error_data.get("error", {}).get(
                        "message", f"HTTP {response.status_code}"
                    )
                    return {
                        "success": False,
                        "error": f"Gemini API Error: {error_msg}",
                        "content": None,
                    }

                data = response.json()

                # Extrai o texto da resposta
                candidates = data.get("candidates", [])
                if not candidates:
                    return {
                        "success": False,
                        "error": "Nenhuma resposta gerada pelo modelo",
                        "content": None,
                    }

                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                text = parts[0].get("text", "") if parts else ""

                # Metadados de uso
                usage = data.get("usageMetadata", {})

                return {
                    "success": True,
                    "content": text,
                    "error": None,
                    "usage": {
                        "prompt_tokens": usage.get("promptTokenCount", 0),
                        "completion_tokens": usage.get("candidatesTokenCount", 0),
                        "total_tokens": usage.get("totalTokenCount", 0),
                    },
                }

        except httpx.TimeoutException:
            return {
                "success": False,
                "error": f"Timeout após {timeout}s - tente com um contexto menor",
                "content": None,
            }
        except httpx.RequestError as e:
            return {
                "success": False,
                "error": f"Erro de conexão: {str(e)}",
                "content": None,
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro inesperado: {str(e)}",
                "content": None,
            }


# Instância global do serviço
gemini_service = GeminiService()
