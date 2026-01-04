from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from services.gemini import GeminiService

router = APIRouter()
gemini_service = GeminiService()

class ChatMessage(BaseModel):
    message: str
    repoContext: Dict[str, Any]

@router.post("/message")
async def chat_message(data: ChatMessage):
    try:
        # Construir o prompt com contexto e restrições
        system_prompt = """
        You are NexoBot, an AI assistant specialized in explaining this specific repository.
        
        CONTEXT ABOUT THE REPOSITORY:
        Name: {name}
        Description: {description}
        Languages: {languages}
        Technologies: {technologies}
        Structure: {structure}
        
        RULES:
        1. You must answer questions related to this repository, its code, architecture, technologies used, and development practices.
        2. If the user asks about the technologies listed in the context, explain how they are used in this project.
        3. If the user's input is related to software development, programming, or the specific technologies of this project, consider it IN SCOPE.
        4. ONLY if the user asks about completely unrelated topics (e.g., general knowledge, history, politics, weather, cooking, sports), you MUST reply exactly with: "This question is outside my scope".
        5. Be helpful, concise, and technical when appropriate.
        6. Answer in English.
        
        User Question: {question}
        """
        
        # Extrair dados do contexto do repositório
        repo_data = data.repoContext
        
        # Formatar tecnologias para string
        tech_list = repo_data.get('techStack', [])
        tech_str = ", ".join([t.get('name', '') for t in tech_list]) if isinstance(tech_list, list) else str(tech_list)
        
        formatted_prompt = system_prompt.format(
            name=repo_data.get('name', 'Unknown'),
            description=repo_data.get('description', ''),
            languages=repo_data.get('language', ''),
            technologies=tech_str,
            structure=str(repo_data.get('fileTree', '')),
            question=data.message
        )

        response = await gemini_service.generate_content(formatted_prompt)
        
        if not response.get('success'):
            raise HTTPException(status_code=500, detail=response.get('error'))
            
        return {"message": response.get('content')}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
