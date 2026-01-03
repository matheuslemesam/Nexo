"""
Pydantic schemas for Podcast generation endpoints
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List


class RepositoryAnalysis(BaseModel):
    """Schema for repository analysis data"""
    name: str = Field(..., description="Repository name")
    description: Optional[str] = Field(None, description="Repository description")
    primary_language: Optional[str] = Field(None, description="Main programming language")
    technologies: List[str] = Field(default_factory=list, description="Technologies used")
    architecture: Optional[str] = Field(None, description="Architecture description")
    data_flow: Optional[str] = Field(None, description="Data flow explanation")
    key_features: List[str] = Field(default_factory=list, description="Key features")
    file_structure: Optional[str] = Field(None, description="File structure overview")
    dependencies: List[str] = Field(default_factory=list, description="Project dependencies")
    additional_info: Optional[Dict[str, Any]] = Field(None, description="Any additional information")


class GeneralPodcastRequest(BaseModel):
    """Request schema for generating general repository podcast"""
    repository_url: str = Field(..., description="GitHub repository URL")
    repo_analysis: Optional[RepositoryAnalysis] = Field(
        None, 
        description="Pre-analyzed repository data (if already available)"
    )
    save_to_file: bool = Field(
        False, 
        description="Whether to save the podcast to a file"
    )


class SpecificPodcastRequest(BaseModel):
    """Request schema for generating specific topic podcast"""
    repository_url: str = Field(..., description="GitHub repository URL")
    question: str = Field(..., description="User's specific question")
    context: Optional[str] = Field(None, description="Additional context")
    ai_response: Optional[str] = Field(
        None, 
        description="AI-generated response (if already available)"
    )
    save_to_file: bool = Field(
        False, 
        description="Whether to save the podcast to a file"
    )


class PodcastResponse(BaseModel):
    """Response schema for podcast generation"""
    success: bool = Field(..., description="Whether podcast was generated successfully")
    message: str = Field(..., description="Status message")
    audio_url: Optional[str] = Field(None, description="URL to access the generated audio")
    file_path: Optional[str] = Field(None, description="Local file path (if saved)")
    duration_seconds: Optional[float] = Field(None, description="Podcast duration")
    script: Optional[str] = Field(None, description="The script used for generation")


class PodcastStatus(BaseModel):
    """Schema for checking podcast generation status"""
    podcast_id: str = Field(..., description="Unique podcast identifier")
    status: str = Field(..., description="Status: pending, processing, completed, failed")
    progress: int = Field(..., ge=0, le=100, description="Progress percentage")
    audio_url: Optional[str] = Field(None, description="URL when completed")
    error: Optional[str] = Field(None, description="Error message if failed")
