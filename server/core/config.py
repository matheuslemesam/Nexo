"""
Configurações da aplicação
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configurações do sistema."""
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "nexo_db"
    
    # JWT - Configurações de Segurança
    SECRET_KEY: str = "nexo-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Segurança
    MAX_LOGIN_ATTEMPTS: int = 5  # Máximo de tentativas de login
    LOCKOUT_DURATION_MINUTES: int = 15  # Tempo de bloqueio após tentativas
    PASSWORD_MIN_LENGTH: int = 8
    
    # App
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Nexo API"
    
    # CORS - Segurança
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
