"""
Modelo de usuário para MongoDB
"""
from datetime import datetime
from typing import Optional


class UserModel:
    """Representação do usuário no MongoDB."""
    
    @staticmethod
    def to_dict(
        email: str,
        name: str,
        hashed_password: str,
        is_active: bool = True,
        created_at: Optional[datetime] = None,
    ) -> dict:
        """Converte para dicionário do MongoDB."""
        return {
            "email": email,
            "name": name,
            "hashed_password": hashed_password,
            "is_active": is_active,
            "created_at": created_at or datetime.utcnow(),
        }
    
    @staticmethod
    def from_dict(data: dict) -> dict:
        """Converte documento MongoDB para dict de resposta."""
        if data and "_id" in data:
            data["_id"] = str(data["_id"])
        return data
