"""
Script de Debug - Teste seu token aqui
"""
import requests

print("\n" + "="*70)
print("🔍 DEBUG - TESTE SEU TOKEN DO INSOMNIA")
print("="*70)

# Cole aqui o token que você copiou do Insomnia
TOKEN = input("\n📋 Cole o token completo aqui e pressione ENTER:\n")

print(f"\n🔍 Analisando token...")
print(f"Tamanho: {len(TOKEN)} caracteres")
print(f"Começa com 'eyJ': {TOKEN.startswith('eyJ')}")
print(f"Tem 3 partes (separadas por '.'): {len(TOKEN.split('.')) == 3}")

if TOKEN.strip() != TOKEN:
    print("⚠️  ATENÇÃO: Token tem espaços no início ou fim!")
    TOKEN = TOKEN.strip()
    print("✅ Espaços removidos")

print("\n🧪 Testando token na API...")

# Teste 1: Com Bearer
headers1 = {"Authorization": f"Bearer {TOKEN}"}
response1 = requests.get("http://127.0.0.1:8000/api/v1/auth/me", headers=headers1)

print(f"\n1️⃣ Teste com 'Bearer {TOKEN[:20]}...'")
print(f"   Status: {response1.status_code}")
if response1.status_code == 200:
    print(f"   ✅ SUCESSO! Dados: {response1.json()}")
else:
    print(f"   ❌ ERRO: {response1.text}")

# Teste 2: Sem Bearer (para comparar)
headers2 = {"Authorization": TOKEN}
response2 = requests.get("http://127.0.0.1:8000/api/v1/auth/me", headers=headers2)

print(f"\n2️⃣ Teste SEM 'Bearer' (só token)")
print(f"   Status: {response2.status_code}")
if response2.status_code == 200:
    print(f"   ✅ SUCESSO!")
else:
    print(f"   ❌ ERRO (esperado)")

# Verificar estrutura do token
print(f"\n🔬 Análise da estrutura do token:")
parts = TOKEN.split('.')
if len(parts) == 3:
    print(f"   ✅ Header: {parts[0][:20]}... ({len(parts[0])} chars)")
    print(f"   ✅ Payload: {parts[1][:20]}... ({len(parts[1])} chars)")
    print(f"   ✅ Signature: {parts[2][:20]}... ({len(parts[2])} chars)")
    
    # Decodificar payload
    try:
        import base64
        import json
        # Adicionar padding se necessário
        payload = parts[1] + '=' * (4 - len(parts[1]) % 4)
        decoded = base64.urlsafe_b64decode(payload)
        payload_data = json.loads(decoded)
        print(f"\n   📦 Payload decodificado:")
        print(f"      Email: {payload_data.get('sub')}")
        
        from datetime import datetime
        exp_timestamp = payload_data.get('exp')
        if exp_timestamp:
            exp_date = datetime.fromtimestamp(exp_timestamp)
            now = datetime.now()
            if exp_date > now:
                print(f"      ✅ Expira em: {exp_date}")
                print(f"      ✅ Válido por mais {(exp_date - now).total_seconds() / 60:.1f} minutos")
            else:
                print(f"      ❌ EXPIRADO em: {exp_date}")
                print(f"      ⚠️  Token expirou há {(now - exp_date).total_seconds() / 60:.1f} minutos!")
                print(f"\n      💡 SOLUÇÃO: Faça login novamente para obter um token novo!")
    except Exception as e:
        print(f"   ⚠️  Não foi possível decodificar: {e}")
else:
    print(f"   ❌ Token inválido! Deve ter 3 partes separadas por '.'")

print("\n" + "="*70)
print("💡 COMO CONFIGURAR NO INSOMNIA:")
print("="*70)
print("""
1. URL: http://localhost:8000/api/v1/auth/me
2. Aba "Auth" → Tipo: "Bearer Token"
3. Campo PREFIX: Bearer
4. Campo TOKEN: cole o token (sem Bearer, só o token mesmo)
5. ENABLED: ✅ marcado
6. Send

IMPORTANTE:
- NÃO cole "Bearer" junto com o token no campo TOKEN
- O PREFIX já adiciona "Bearer" automaticamente
- Token expira em 30 minutos - faça login novamente se expirou
""")
print("="*70 + "\n")
