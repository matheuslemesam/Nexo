"""
Schemas de validação para usuários
"""
from datetime import datetime
from typing import Optional
import re

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserBase(BaseModel):
    """Schema base de usuário."""
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)


class UserCreate(UserBase):
    """Schema para criação de usuário."""
    password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """
        Valida força da senha:
        - Mínimo 8 caracteres
        - Pelo menos uma letra maiúscula
        - Pelo menos uma letra minúscula
        - Pelo menos um número
        """
        if len(v) < 8:
            raise ValueError('Senha deve ter no mínimo 8 caracteres')
        
        if not re.search(r'[A-Z]', v):
            raise ValueError('Senha deve conter pelo menos uma letra maiúscula')
        
        if not re.search(r'[a-z]', v):
            raise ValueError('Senha deve conter pelo menos uma letra minúscula')
        
        if not re.search(r'\d', v):
            raise ValueError('Senha deve conter pelo menos um número')
        
        return v


class UserLogin(BaseModel):
    """Schema para login de usuário."""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema de resposta de usuário."""
    id: str = Field(..., alias="_id")
    created_at: datetime
    is_active: bool = True
    
    class Config:
        populate_by_name = True


class Token(BaseModel):
    """Schema de token de autenticação."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema de dados do token."""
    email: Optional[str] = None
