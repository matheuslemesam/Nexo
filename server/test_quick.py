"""
Teste rápido de autenticação
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("\n" + "="*60)
print("🧪 TESTE RÁPIDO DE AUTENTICAÇÃO")
print("="*60)

# 1. Registrar
print("\n1️⃣ Registrando usuário...")
register_data = {
    "email": "teste.rapido@nexo.com",
    "name": "Teste Rápido",
    "password": "senha123"
}

response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=register_data)
print(f"Status: {response.status_code}")
if response.status_code == 201:
    print("✅ Registro OK")
    print(f"Dados: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
elif response.status_code == 400:
    print("⚠️  Usuário já existe (OK para teste)")
else:
    print(f"❌ Erro: {response.text}")

# 2. Login
print("\n2️⃣ Fazendo login...")
login_data = {
    "email": "teste.rapido@nexo.com",
    "password": "senha123"
}

response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    token_data = response.json()
    token = token_data["access_token"]
    print("✅ Login OK")
    print(f"Token: {token[:50]}...")
    
    # 3. Acessar dados do usuário
    print("\n3️⃣ Acessando dados do usuário...")
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(f"{BASE_URL}/api/v1/auth/me", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ Autenticação OK")
        print(f"Dados: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    else:
        print(f"❌ Erro: {response.text}")
else:
    print(f"❌ Erro no login: {response.text}")

# 4. Verificar MongoDB
print("\n4️⃣ Verificando MongoDB...")
try:
    from pymongo import MongoClient
    client = MongoClient('mongodb://localhost:27017')
    db = client['nexo_db']
    
    collections = db.list_collection_names()
    print(f"Collections: {collections}")
    
    if 'users' in collections:
        count = db.users.count_documents({})
        print(f"Total de usuários: {count}")
        
        users = list(db.users.find({}, {"_id": 1, "email": 1, "name": 1}).limit(5))
        print("Últimos usuários:")
        for user in users:
            print(f"  - {user['name']} ({user['email']})")
    else:
        print("⚠️  Collection 'users' não foi criada ainda")
        
except Exception as e:
    print(f"❌ Erro ao conectar ao MongoDB: {e}")

print("\n" + "="*60)
print("✅ TESTE CONCLUÍDO")
print("="*60 + "\n")
