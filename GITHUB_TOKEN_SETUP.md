# Como Configurar o GitHub Token

O erro "404: Repositório não encontrado" acontece porque o backend precisa de um **GitHub Personal Access Token** para acessar repositórios.

## 📝 Passo a Passo para Criar o Token

### 1. Acesse as Configurações do GitHub

Vá para: https://github.com/settings/tokens

Ou navegue: **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**

### 2. Gere um Novo Token

- Clique em **"Generate new token"** → **"Generate new token (classic)"**
- Dê um nome descritivo: `Nexo API Token`
- Defina a expiração (recomendado: 90 dias ou mais)

### 3. Selecione as Permissões Necessárias

Marque apenas:

- ✅ **`repo`** (acesso completo a repositórios)
  - Isso dá acesso para ler código, metadados, branches, etc.

Para repositórios públicos, apenas `public_repo` já é suficiente.

### 4. Gere e Copie o Token

- Clique em **"Generate token"**
- ⚠️ **COPIE O TOKEN AGORA** - ele não será mostrado novamente!
- Formato: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## ⚙️ Configure no Backend

### 1. Crie/Edite o arquivo `.env` no servidor:

```bash
cd server
cp .env.example .env
nano .env  # ou use seu editor favorito
```

### 2. Adicione o token:

```env
# GitHub API Configuration
GITHUB_TOKEN=ghp_seu_token_aqui
```

### 3. Reinicie o servidor:

```bash
# Se estiver usando Docker
docker compose restart

# Ou se estiver rodando direto
# Ctrl+C para parar e depois
python main.py
```

## ✅ Teste

Agora tente analisar um repositório novamente. O erro 404 deve desaparecer!

## 🔒 Segurança

- **Nunca compartilhe seu token**
- **Nunca commite o arquivo `.env`** (já está no .gitignore)
- Use tokens com permissões mínimas necessárias
- Regenere o token se suspeitar de vazamento

## 🆘 Problemas Comuns

### Erro 403 - Rate Limit

- Aguarde 1 hora ou use outro token
- Com token autenticado, o limite é 5000 requisições/hora

### Erro 404 - Mesmo com Token

- Verifique se o token tem permissão `repo`
- Confirme que o repositório existe e está acessível
- Para repos privados, certifique-se de ter acesso

### Token não está sendo usado

- Verifique se o `.env` está no diretório correto (`server/.env`)
- Reinicie o servidor após editar o `.env`
- Verifique logs do servidor para confirmar carregamento
