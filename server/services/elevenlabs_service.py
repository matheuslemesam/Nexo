"""
ElevenLabs Service for generating podcasts about repositories
Supports two types of podcasts:
1. General repository overview
2. Specific questions/topics within a repository
"""

import httpx
from typing import Optional, Dict, Any
from core.config import settings


class ElevenLabsService:
    """Service to interact with ElevenLabs API for text-to-speech podcast generation"""
    
    # Voice IDs - Using default pre-made voices available to all accounts
    # Note: You can get more voices from https://elevenlabs.io/voice-library
    STOKES_VOICE_ID = "TxGEqnHWrfWFTfGW9XjX"  # Original Stokes ID
    ADAM_VOICE_ID = "pNInz6obpgDQGcFmaJgB"     # Adam - Deep and Resonant (backup)
    RACHEL_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"   # Rachel - Calm and Articulate
    
    BASE_URL = "https://api.elevenlabs.io/v1"
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize ElevenLabs service
        
        Args:
            api_key: ElevenLabs API key (defaults to settings)
        """
        self.api_key = api_key or settings.ELEVENLABS_API_KEY
        self.headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
    
    async def generate_podcast(
        self,
        text: str,
        voice_id: Optional[str] = None,
        model_id: str = "eleven_turbo_v2",  # Free tier compatible model
        voice_settings: Optional[Dict[str, Any]] = None
    ) -> bytes:
        """
        Generate audio podcast from text using ElevenLabs
        
        Args:
            text: The text to convert to speech
            voice_id: Voice ID to use (defaults to Adam - widely available)
            model_id: ElevenLabs model ID (eleven_turbo_v2 for free tier)
            voice_settings: Custom voice settings
            
        Returns:
            Audio data in bytes (MP3 format)
        """
        # Use Adam voice by default as it's available to all free accounts
        voice_id = voice_id or self.ADAM_VOICE_ID
        
        # Default voice settings for natural, conversational podcast
        if voice_settings is None:
            voice_settings = {
                "stability": 0.5,  # Moderate stability for natural variation
                "similarity_boost": 0.75,  # High similarity to voice
                "style": 0.3,  # Moderate style for conversational tone
                "use_speaker_boost": True
            }
        
        url = f"{self.BASE_URL}/text-to-speech/{voice_id}"
        
        data = {
            "text": text,
            "model_id": model_id,
            "voice_settings": voice_settings
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=data, headers=self.headers)
            response.raise_for_status()
            return response.content
    
    def create_general_podcast_prompt(self, repo_analysis: Dict[str, Any]) -> str:
        """
        Create a comprehensive podcast script for general repository overview
        
        Args:
            repo_analysis: Dictionary containing repository analysis data
            
        Returns:
            Formatted podcast script in English
        """
        repo_name = repo_analysis.get("name", "this repository")
        description = repo_analysis.get("description", "")
        language = repo_analysis.get("primary_language", "")
        tech_stack = repo_analysis.get("technologies", [])
        architecture = repo_analysis.get("architecture", "")
        data_flow = repo_analysis.get("data_flow", "")
        key_features = repo_analysis.get("key_features", [])
        file_structure = repo_analysis.get("file_structure", "")
        dependencies = repo_analysis.get("dependencies", [])
        
        script = f"""
Welcome to the Repository Deep Dive Podcast. Today, we're exploring {repo_name}, 
a fascinating project that showcases modern software development practices.

Let me give you a comprehensive overview of what this project is all about.

{f"First, let's talk about what this project does. {description}" if description else ""}

{f"This repository is primarily built with {language}, " if language else ""}
{f"and leverages several key technologies including {', '.join(tech_stack[:5])}." if tech_stack else ""}

Now, let's dive into the architecture. {architecture if architecture else 
"This project follows a modular architecture designed for scalability and maintainability."}

One of the most interesting aspects is how data flows through the system. {data_flow if data_flow else
"The application processes data through well-defined layers, ensuring separation of concerns and clean code organization."}

{f"The project structure is organized as follows: {file_structure}" if file_structure else ""}

Let me highlight some of the key features that make this project stand out:
{self._format_list_for_speech(key_features) if key_features else 
"This project includes several notable features designed to provide a robust and efficient solution."}

{"The project relies on several important dependencies, including " + ", ".join(dependencies[:5]) + ", which work together to provide the necessary functionality." if dependencies else ""}

In terms of code organization, you'll find that the project follows best practices with clear 
separation of concerns, making it easy to navigate and understand.

This repository represents a well-thought-out solution that balances functionality, 
performance, and maintainability. Whether you're looking to contribute, learn from the code, 
or use it in your own projects, there's a lot to explore here.

Thank you for joining me on this deep dive. I hope this overview gives you a solid 
understanding of what this project brings to the table.
"""
        return script.strip()
    
    def create_specific_topic_prompt(
        self,
        question: str,
        context: str,
        analysis_response: str
    ) -> str:
        """
        Create a focused podcast script for specific topics or questions
        
        Args:
            question: The user's specific question
            context: Relevant repository context
            analysis_response: AI analysis/answer to the question
            
        Returns:
            Formatted podcast script in English
        """
        script = f"""
Welcome back to the Repository Deep Dive. Today, we're focusing on a specific aspect 
of this project that you've asked about.

Your question was: {question}

Let me walk you through this in detail.

{analysis_response}

{f"To give you some additional context: {context}" if context else ""}

I hope this explanation helps clarify things for you. If you have more questions about 
other aspects of this repository, feel free to ask, and we can explore those areas together.

Thanks for tuning in to this focused deep dive.
"""
        return script.strip()
    
    def _format_list_for_speech(self, items: list) -> str:
        """
        Format a list of items for natural speech
        
        Args:
            items: List of items to format
            
        Returns:
            Formatted string for speech
        """
        if not items:
            return ""
        
        if len(items) == 1:
            return items[0]
        elif len(items) == 2:
            return f"{items[0]} and {items[1]}"
        else:
            formatted_items = []
            for i, item in enumerate(items):
                if i == len(items) - 1:
                    formatted_items.append(f"and {item}")
                else:
                    formatted_items.append(item)
            return ", ".join(formatted_items)
    
    async def generate_general_podcast(
        self,
        repo_analysis: Dict[str, Any],
        output_path: Optional[str] = None
    ) -> bytes:
        """
        Generate a complete general repository overview podcast
        
        Args:
            repo_analysis: Repository analysis data
            output_path: Optional path to save the audio file
            
        Returns:
            Audio data in bytes
        """
        script = self.create_general_podcast_prompt(repo_analysis)
        audio_data = await self.generate_podcast(script)
        
        if output_path:
            with open(output_path, "wb") as f:
                f.write(audio_data)
        
        return audio_data
    
    async def generate_specific_podcast(
        self,
        question: str,
        context: str,
        analysis_response: str,
        output_path: Optional[str] = None
    ) -> bytes:
        """
        Generate a podcast for specific topic/question
        
        Args:
            question: User's question
            context: Repository context
            analysis_response: AI-generated answer
            output_path: Optional path to save the audio file
            
        Returns:
            Audio data in bytes
        """
        script = self.create_specific_topic_prompt(question, context, analysis_response)
        audio_data = await self.generate_podcast(script)
        
        if output_path:
            with open(output_path, "wb") as f:
                f.write(audio_data)
        
        return audio_data


# Singleton instance
elevenlabs_service = ElevenLabsService()
