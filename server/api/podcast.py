"""
Podcast generation API endpoints
Handles ElevenLabs integration for repository explanation podcasts
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import Response, FileResponse
from typing import Optional
import uuid
import asyncio
from datetime import datetime
from pathlib import Path

from schemas.podcast import (
    GeneralPodcastRequest,
    SpecificPodcastRequest,
    PodcastResponse,
    PodcastStatus,
    RepositoryAnalysis
)
from services.elevenlabs_service import elevenlabs_service
from services.repo_analyzer import analyze_github_repo
from core.config import settings

router = APIRouter()

# In-memory storage for podcast generation status (use Redis in production)
podcast_status_store = {}


@router.post("/generate/general", response_model=PodcastResponse)
async def generate_general_podcast(
    request: GeneralPodcastRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate a comprehensive podcast explaining the entire repository
    
    This endpoint creates a detailed audio explanation covering:
    - Repository overview and purpose
    - Architecture and design patterns
    - Data flow and relationships
    - Key features and technologies
    - Project structure and organization
    
    Args:
        request: GeneralPodcastRequest with repository URL and optional analysis data
        
    Returns:
        PodcastResponse with audio URL or file path
    """
    try:
        # If repo_analysis is not provided, analyze the repository
        if not request.repo_analysis:
            try:
                analysis_dict = await analyze_github_repo(request.repository_url)
                repo_analysis = analysis_dict
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to analyze repository: {str(e)}"
                )
        else:
            repo_analysis = request.repo_analysis.model_dump()
        
        # Generate unique filename
        podcast_id = uuid.uuid4().hex[:8]
        output_path = f"podcasts/general_{podcast_id}.mp3"
        
        # Ensure podcasts directory exists
        Path("podcasts").mkdir(exist_ok=True)
        
        # Generate podcast
        audio_data = await elevenlabs_service.generate_general_podcast(
            repo_analysis=repo_analysis,
            output_path=output_path
        )
        
        # Get the script for reference
        script = elevenlabs_service.create_general_podcast_prompt(repo_analysis)
        
        return PodcastResponse(
            success=True,
            message="General repository podcast generated successfully",
            audio_url=f"/api/v1/podcast/audio/{podcast_id}",
            file_path=output_path,
            script=script if request.save_to_file else None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate podcast: {str(e)}"
        )


@router.post("/generate/specific", response_model=PodcastResponse)
async def generate_specific_podcast(
    request: SpecificPodcastRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate a focused podcast explaining a specific aspect of the repository
    
    This endpoint creates a targeted audio explanation for:
    - Specific code sections or files
    - Particular features or functionalities
    - Implementation details
    - Answers to user questions
    
    Args:
        request: SpecificPodcastRequest with question and context
        
    Returns:
        PodcastResponse with audio URL or file path
    """
    try:
        # TODO: If ai_response is not provided, integrate with Gemini
        # to generate the answer first
        if not request.ai_response:
            # Placeholder - integrate with your Gemini chat
            raise HTTPException(
                status_code=400,
                detail="AI response is required. Please get an answer from Gemini first."
            )
        
        # Generate podcast
        output_path = None
        if request.save_to_file:
            output_path = f"podcasts/specific_{uuid.uuid4().hex[:8]}.mp3"
        
        audio_data = await elevenlabs_service.generate_specific_podcast(
            question=request.question,
            context=request.context or "",
            analysis_response=request.ai_response,
            output_path=output_path
        )
        
        # Get the script for reference
        script = elevenlabs_service.create_specific_topic_prompt(
            request.question,
            request.context or "",
            request.ai_response
        )
        
        return PodcastResponse(
            success=True,
            message="Specific topic podcast generated successfully",
            audio_url=f"/api/v1/podcast/audio/{output_path}" if output_path else None,
            file_path=output_path,
            script=script
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate podcast: {str(e)}"
        )


@router.post("/generate/async/general")
async def generate_general_podcast_async(
    request: GeneralPodcastRequest,
    background_tasks: BackgroundTasks
):
    """
    Start asynchronous generation of general repository podcast
    
    Returns immediately with a podcast_id to check status later.
    Useful for long-running podcast generation.
    
    Returns:
        Dict with podcast_id and status_url
    """
    podcast_id = str(uuid.uuid4())
    
    podcast_status_store[podcast_id] = {
        "status": "pending",
        "progress": 0,
        "created_at": datetime.utcnow().isoformat()
    }
    
    background_tasks.add_task(
        _generate_general_podcast_background,
        podcast_id,
        request
    )
    
    return {
        "podcast_id": podcast_id,
        "status": "pending",
        "status_url": f"/api/v1/podcast/status/{podcast_id}"
    }


@router.post("/generate/async/specific")
async def generate_specific_podcast_async(
    request: SpecificPodcastRequest,
    background_tasks: BackgroundTasks
):
    """
    Start asynchronous generation of specific topic podcast
    
    Returns immediately with a podcast_id to check status later.
    
    Returns:
        Dict with podcast_id and status_url
    """
    podcast_id = str(uuid.uuid4())
    
    podcast_status_store[podcast_id] = {
        "status": "pending",
        "progress": 0,
        "created_at": datetime.utcnow().isoformat()
    }
    
    background_tasks.add_task(
        _generate_specific_podcast_background,
        podcast_id,
        request
    )
    
    return {
        "podcast_id": podcast_id,
        "status": "pending",
        "status_url": f"/api/v1/podcast/status/{podcast_id}"
    }


@router.get("/status/{podcast_id}", response_model=PodcastStatus)
async def get_podcast_status(podcast_id: str):
    """
    Check the status of an asynchronous podcast generation
    
    Args:
        podcast_id: Unique podcast identifier
        
    Returns:
        PodcastStatus with current progress and result
    """
    if podcast_id not in podcast_status_store:
        raise HTTPException(status_code=404, detail="Podcast ID not found")
    
    status_data = podcast_status_store[podcast_id]
    
    return PodcastStatus(
        podcast_id=podcast_id,
        status=status_data["status"],
        progress=status_data["progress"],
        audio_url=status_data.get("audio_url"),
        error=status_data.get("error")
    )


@router.get("/audio/{podcast_id}")
async def get_podcast_audio(podcast_id: str):
    """
    Stream or download the generated podcast audio file
    
    Args:
        podcast_id: Unique podcast identifier or 'demo' for demo file
        
    Returns:
        Audio file (MP3)
    """
    # Handle demo file request
    if podcast_id == "demo":
        demo_path = Path("podcasts/test_general.mp3")
        if demo_path.exists():
            return FileResponse(
                demo_path,
                media_type="audio/mpeg",
                filename="nexo_demo_podcast.mp3"
            )
    
    file_path = Path(f"podcasts/general_{podcast_id}.mp3")
    
    if not file_path.exists():
        # Try specific podcast
        file_path = Path(f"podcasts/specific_{podcast_id}.mp3")
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Podcast audio not found")
    
    return FileResponse(
        file_path,
        media_type="audio/mpeg",
        filename=f"podcast_{podcast_id}.mp3"
    )


async def _generate_general_podcast_background(
    podcast_id: str,
    request: GeneralPodcastRequest
):
    """Background task for generating general podcast"""
    try:
        podcast_status_store[podcast_id]["status"] = "processing"
        podcast_status_store[podcast_id]["progress"] = 25
        
        if not request.repo_analysis:
            raise ValueError("Repository analysis is required")
        
        repo_analysis = request.repo_analysis.model_dump()
        
        podcast_status_store[podcast_id]["progress"] = 50
        
        output_path = f"podcasts/general_{podcast_id[:8]}.mp3"
        await elevenlabs_service.generate_general_podcast(
            repo_analysis=repo_analysis,
            output_path=output_path
        )
        
        podcast_status_store[podcast_id].update({
            "status": "completed",
            "progress": 100,
            "audio_url": f"/api/v1/podcast/audio/{output_path}",
            "file_path": output_path
        })
        
    except Exception as e:
        podcast_status_store[podcast_id].update({
            "status": "failed",
            "progress": 0,
            "error": str(e)
        })


async def _generate_specific_podcast_background(
    podcast_id: str,
    request: SpecificPodcastRequest
):
    """Background task for generating specific podcast"""
    try:
        podcast_status_store[podcast_id]["status"] = "processing"
        podcast_status_store[podcast_id]["progress"] = 25
        
        if not request.ai_response:
            raise ValueError("AI response is required")
        
        podcast_status_store[podcast_id]["progress"] = 50
        
        output_path = f"podcasts/specific_{podcast_id[:8]}.mp3"
        await elevenlabs_service.generate_specific_podcast(
            question=request.question,
            context=request.context or "",
            analysis_response=request.ai_response,
            output_path=output_path
        )
        
        podcast_status_store[podcast_id].update({
            "status": "completed",
            "progress": 100,
            "audio_url": f"/api/v1/podcast/audio/{output_path}",
            "file_path": output_path
        })
        
    except Exception as e:
        podcast_status_store[podcast_id].update({
            "status": "failed",
            "progress": 0,
            "error": str(e)
        })
