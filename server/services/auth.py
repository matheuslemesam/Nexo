"""
Serviço de autenticação
"""
from datetime import timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from core.config import settings
from core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
)
from models.user import UserModel
from schemas.user import UserCreate, UserLogin, Token, UserResponse
from services.database import get_database


oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


class AuthService:
    """Serviço de autenticação e gerenciamento de usuários."""
    
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.users
    
    async def create_user(self, user_data: UserCreate) -> UserResponse:
        """Registra novo usuário."""
        # Verifica se email já existe
        existing_user = await self.collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já cadastrado",
            )
        
        # Cria usuário
        user_dict = UserModel.to_dict(
            email=user_data.email,
            name=user_data.name,
            hashed_password=get_password_hash(user_data.password),
        )
        
        result = await self.collection.insert_one(user_dict)
        user_dict["_id"] = str(result.inserted_id)
        
        return UserResponse(**user_dict)
    
    async def authenticate_user(self, credentials: UserLogin) -> Optional[dict]:
        """Autentica usuário."""
        user = await self.collection.find_one({"email": credentials.email})
        
        if not user:
            return None
        
        if not verify_password(credentials.password, user["hashed_password"]):
            return None
        
        if not user.get("is_active", True):
            return None
        
        return UserModel.from_dict(user)
    
    async def login(self, credentials: UserLogin) -> Token:
        """Realiza login e retorna token."""
        user = await self.authenticate_user(credentials)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        access_token = create_access_token(
            data={"sub": user["email"]},
            expires_delta=access_token_expires,
        )
        
        return Token(access_token=access_token)


def get_auth_service() -> AuthService:
    """Dependency injection do serviço de autenticação."""
    return AuthService()


async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserResponse:
    """Obtém usuário atual do token (dependency function)."""
    auth_service = get_auth_service()
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    user = await auth_service.collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    
    return UserResponse(**UserModel.from_dict(user))
