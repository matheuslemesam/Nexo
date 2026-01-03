import io
import zipfile
import httpx
from fastapi import HTTPException

# Configurações / Constantes
MAX_REPO_SIZE_BYTES = 50 * 1024 * 1024  # Limite de 50MB (Zipado)
IGNORED_DIRS = {
    ".git", ".github", ".vscode", ".idea", "__pycache__", 
    "node_modules", "venv", "env", "dist", "build", "coverage", ".next", "target"
}
IGNORED_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".pdf", 
    ".zip", ".tar", ".gz", ".exe", ".dll", ".so", ".pyc", ".lock", ".bin"
}

def _is_file_relevant(filename: str) -> bool:
    """Helper interno para filtrar arquivos."""
    parts = filename.split("/")
    
    # Ignora pastas bloqueadas
    for part in parts:
        if part in IGNORED_DIRS:
            return False
            
    # Ignora arquivos ocultos (exceto .env.example) e extensões binárias
    basename = parts[-1]
    if basename.startswith(".") and basename not in [".env.example", ".gitignore", "Dockerfile"]:
        return False
    
    if any(filename.endswith(ext) for ext in IGNORED_EXTENSIONS):
        return False
        
    return True

async def download_and_extract(github_url: str, branch: str, token: str = None) -> dict:
    """
    Baixa o repositório, valida tamanho e extrai o texto.
    """
    # Monta a URL do ZIP
    # Ex: https://github.com/user/repo -> https://github.com/user/repo/archive/refs/heads/main.zip
    clean_url = github_url.rstrip('/')
    zip_url = f"{clean_url}/archive/refs/heads/{branch}.zip"

    # Configura Headers (Autenticação se houver token)
    headers = {}
    if token:
        headers["Authorization"] = f"token {token}"

    async with httpx.AsyncClient(follow_redirects=True) as client:
        # Usamos .stream() para ler os headers ANTES de baixar o corpo
        async with client.stream("GET", zip_url, headers=headers) as response:
            
            if response.status_code != 200:
                if response.status_code == 404:
                    raise HTTPException(status_code=404, detail="Repositório não encontrado. Verifique a URL, a Branch ou se o Token é válido para este repo.")
                raise HTTPException(status_code=400, detail=f"Erro no GitHub: {response.status_code}")

            # --- VALIDAÇÃO DE CONTENT-LENGTH ---
            # O GitHub geralmente envia esse header. Se for muito grande, abortamos.
            content_length = response.headers.get("content-length")
            if content_length and int(content_length) > MAX_REPO_SIZE_BYTES:
                raise HTTPException(
                    status_code=413, 
                    detail=f"Repositório muito grande ({int(content_length) / 1024 / 1024:.2f} MB). O limite é {MAX_REPO_SIZE_BYTES / 1024 / 1024} MB."
                )
            
            # Se passou na verificação, lemos o conteúdo para a memória
            file_bytes = await response.aread()

    # Processamento do ZIP
    full_code_context = ""
    file_count = 0
    errors = []

    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            for file_info in z.infolist():
                if file_info.is_dir() or not _is_file_relevant(file_info.filename):
                    continue

                try:
                    with z.open(file_info) as f:
                        # Tenta decodificar. Se falhar (ex: binário disfarçado), ignora.
                        content = f.read().decode("utf-8")
                        
                        # Formatação para o Gemini
                        full_code_context += f"\n<file path='{file_info.filename}'>\n"
                        full_code_context += content
                        full_code_context += "\n</file>\n"
                        file_count += 1
                except UnicodeDecodeError:
                    continue # Arquivo provavelmente não é texto
                except Exception as e:
                    errors.append(f"Erro ao ler {file_info.filename}: {str(e)}")

    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="O arquivo baixado não é um ZIP válido.")

    return {
        "files_processed": file_count,
        "repo_size_chars": len(full_code_context),
        "payload": full_code_context
    }