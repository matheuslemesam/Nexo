/**
 * Serviço de cache para repositórios analisados
 * Armazena dados no localStorage para evitar requisições redundantes
 */

import type { AnalyzeResponse } from "./repoAnalysisService";

interface CacheEntry {
  data: AnalyzeResponse;
  timestamp: number;
  userId: string;
}

interface CacheStore {
  [repoUrl: string]: CacheEntry;
}

// Tempo de expiração do cache: 1 hora (em milissegundos)
const CACHE_EXPIRATION = 60 * 60 * 1000;

// Chave do cache no localStorage
const CACHE_KEY = "nexo_repo_cache";

/**
 * Obtém o store de cache do localStorage
 */
function getCacheStore(): CacheStore {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Erro ao ler cache:", error);
    return {};
  }
}

/**
 * Salva o store de cache no localStorage
 */
function saveCacheStore(store: CacheStore): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error("Erro ao salvar cache:", error);
  }
}

/**
 * Normaliza URL do repositório para usar como chave
 */
function normalizeRepoUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/\/$/, "")
    .replace("https://github.com/", "");
}

/**
 * Verifica se o cache é válido (não expirou)
 */
function isCacheValid(entry: CacheEntry): boolean {
  const now = Date.now();
  return now - entry.timestamp < CACHE_EXPIRATION;
}

/**
 * Obtém dados do repositório do cache
 * @param repoUrl URL do repositório
 * @param userId ID do usuário atual (null se não autenticado)
 * @returns Dados do cache ou null se não encontrado/expirado
 */
export function getFromCache(
  repoUrl: string,
  userId: string | null
): AnalyzeResponse | null {
  const normalizedUrl = normalizeRepoUrl(repoUrl);
  const store = getCacheStore();
  const entry = store[normalizedUrl];

  if (!entry) {
    console.log("📦 Cache miss:", normalizedUrl);
    return null;
  }

  // Verifica se o cache é do mesmo usuário (ou ambos são null)
  if (entry.userId !== (userId || "anonymous")) {
    console.log("👤 Cache de outro usuário, ignorando");
    return null;
  }

  // Verifica se o cache expirou
  if (!isCacheValid(entry)) {
    console.log("⏰ Cache expirado, removendo:", normalizedUrl);
    delete store[normalizedUrl];
    saveCacheStore(store);
    return null;
  }

  console.log(
    "✅ Cache hit:",
    normalizedUrl,
    `(idade: ${Math.round((Date.now() - entry.timestamp) / 1000 / 60)} min)`
  );
  return entry.data;
}

/**
 * Salva dados do repositório no cache
 * @param repoUrl URL do repositório
 * @param data Dados da análise
 * @param userId ID do usuário atual (null se não autenticado)
 */
export function saveToCache(
  repoUrl: string,
  data: AnalyzeResponse,
  userId: string | null
): void {
  const normalizedUrl = normalizeRepoUrl(repoUrl);
  const store = getCacheStore();

  store[normalizedUrl] = {
    data,
    timestamp: Date.now(),
    userId: userId || "anonymous",
  };

  saveCacheStore(store);
  console.log("💾 Dados salvos no cache:", normalizedUrl);
}

/**
 * Remove um repositório específico do cache
 * @param repoUrl URL do repositório
 */
export function removeFromCache(repoUrl: string): void {
  const normalizedUrl = normalizeRepoUrl(repoUrl);
  const store = getCacheStore();

  if (store[normalizedUrl]) {
    delete store[normalizedUrl];
    saveCacheStore(store);
    console.log("🗑️ Repositório removido do cache:", normalizedUrl);
  }
}

/**
 * Limpa todo o cache
 */
export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY);
  console.log("🧹 Cache limpo completamente");
}

/**
 * Limpa entradas expiradas do cache
 * @returns Número de entradas removidas
 */
export function cleanExpiredCache(): number {
  const store = getCacheStore();
  let removed = 0;

  Object.keys(store).forEach((key) => {
    if (!isCacheValid(store[key])) {
      delete store[key];
      removed++;
    }
  });

  if (removed > 0) {
    saveCacheStore(store);
    console.log(`🧹 ${removed} entrada(s) expirada(s) removida(s) do cache`);
  }

  return removed;
}

/**
 * Obtém estatísticas do cache
 */
export function getCacheStats(): {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  totalSize: string;
} {
  const store = getCacheStore();
  const entries = Object.values(store);

  const validEntries = entries.filter(isCacheValid).length;
  const expiredEntries = entries.length - validEntries;

  // Calcula tamanho aproximado em KB
  const sizeInBytes = new Blob([JSON.stringify(store)]).size;
  const totalSize = `${(sizeInBytes / 1024).toFixed(2)} KB`;

  return {
    totalEntries: entries.length,
    validEntries,
    expiredEntries,
    totalSize,
  };
}

/**
 * Limpa cache de um usuário específico
 * @param userId ID do usuário
 */
export function clearUserCache(userId: string): void {
  const store = getCacheStore();
  let removed = 0;

  Object.keys(store).forEach((key) => {
    if (store[key].userId === userId) {
      delete store[key];
      removed++;
    }
  });

  if (removed > 0) {
    saveCacheStore(store);
    console.log(
      `🧹 ${removed} entrada(s) do usuário ${userId} removida(s) do cache`
    );
  }
}

export default {
  getFromCache,
  saveToCache,
  removeFromCache,
  clearCache,
  cleanExpiredCache,
  getCacheStats,
  clearUserCache,
};
