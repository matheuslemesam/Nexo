"""
Rotas de autenticação
"""
from fastapi import APIRouter, Depends, status

from schemas.user import UserCreate, UserLogin, UserResponse, Token
from services.auth import AuthService, get_auth_service, get_current_user


router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Registra um novo usuário.
    
    - **email**: Email válido
    - **name**: Nome completo (mínimo 2 caracteres)
    - **password**: Senha (mínimo 8 caracteres)
    """
    return await auth_service.create_user(user_data)


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Realiza login e retorna token de acesso.
    
    - **email**: Email cadastrado
    - **password**: Senha do usuário
    """
    return await auth_service.login(credentials)


@router.get("/me", response_model=UserResponse)
async def get_user_info(
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Retorna dados do usuário autenticado.
    
    Requer token de autenticação no header:
    Authorization: Bearer <token>
    """
    return current_user

