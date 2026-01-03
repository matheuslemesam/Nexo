"""
Configuração e conexão com MongoDB
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional

from core.config import settings


class MongoDB:
    """Classe para gerenciar conexão com MongoDB."""
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None


mongodb = MongoDB()


async def connect_to_mongo():
    """Conecta ao MongoDB."""
    mongodb.client = AsyncIOMotorClient(settings.MONGODB_URL)
    mongodb.db = mongodb.client[settings.MONGODB_DB_NAME]
    
    # Teste de conexão
    try:
        await mongodb.client.admin.command('ping')
        print(f"✅ Conectado ao MongoDB: {settings.MONGODB_DB_NAME}")
    except Exception as e:
        print(f"❌ Erro ao conectar ao MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Fecha conexão com MongoDB."""
    if mongodb.client:
        mongodb.client.close()
        print("❌ Conexão com MongoDB encerrada")


def get_database() -> AsyncIOMotorDatabase:
    """Retorna instância do banco de dados."""
    return mongodb.db
