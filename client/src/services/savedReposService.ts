/**
 * Service para repositórios salvos do usuário
 */

import api from "./api";

// === Tipos ===

export interface SaveRepoRequest {
  repo_url: string;
  repo_name: string;
  repo_full_name: string;
  description?: string | null;
  stars?: number;
  forks?: number;
  language?: string | null;
  overview?: string | null;
  podcast_url?: string | null;
  podcast_script?: string | null;
  repository_info?: Record<string, unknown> | null;
  file_analysis?: Record<string, unknown> | null;
  dependencies?: Array<Record<string, unknown>> | null;
}

export interface SavedRepo {
  id: string;
  user_id: string;
  repo_url: string;
  repo_name: string;
  repo_full_name: string;
  description?: string | null;
  stars: number;
  forks: number;
  language?: string | null;
  overview?: string | null;
  podcast_url?: string | null;
  podcast_script?: string | null;
  repository_info?: Record<string, unknown> | null;
  file_analysis?: Record<string, unknown> | null;
  dependencies?: Array<Record<string, unknown>> | null;
  created_at: string;
  updated_at: string;
}

export interface SavedRepoSummary {
  id: string;
  repo_url: string;
  repo_name: string;
  repo_full_name: string;
  description?: string | null;
  stars: number;
  forks: number;
  language?: string | null;
  has_overview: boolean;
  has_podcast: boolean;
  created_at: string;
}

export interface SavedRepoListResponse {
  repos: SavedRepoSummary[];
  total: number;
}

// === Service Functions ===

/**
 * Salva um repositório no perfil do usuário
 */
export async function saveRepository(data: SaveRepoRequest): Promise<SavedRepo> {
  const response = await api.post<SavedRepo>("/api/v1/repos/save", data);
  // Converte _id para id se necessário
  if ('_id' in response && !response.id) {
    response.id = (response as unknown as { _id: string })._id;
  }
  return response;
}

/**
 * Lista todos os repositórios salvos do usuário
 */
export async function listSavedRepos(skip = 0, limit = 20): Promise<SavedRepoListResponse> {
  const response = await api.get<SavedRepoListResponse>(`/api/v1/repos/list?skip=${skip}&limit=${limit}`);
  // Converte _id para id se necessário
  if (response.repos) {
    response.repos = response.repos.map(repo => {
      if ('_id' in repo && !repo.id) {
        repo.id = (repo as unknown as { _id: string })._id;
      }
      return repo;
    });
  }
  return response;
}

/**
 * Obtém detalhes completos de um repositório salvo
 */
export async function getSavedRepo(repoId: string): Promise<SavedRepo> {
  const response = await api.get<SavedRepo>(`/api/v1/repos/${repoId}`);
  if ('_id' in response && !response.id) {
    response.id = (response as unknown as { _id: string })._id;
  }
  return response;
}

/**
 * Remove um repositório salvo
 */
export async function deleteSavedRepo(repoId: string): Promise<void> {
  await api.delete(`/api/v1/repos/${repoId}`);
}

/**
 * Atualiza informações de podcast de um repositório salvo
 */
export async function updateRepoPodcast(
  repoId: string,
  podcastUrl?: string,
  podcastScript?: string
): Promise<SavedRepo> {
  const params = new URLSearchParams();
  if (podcastUrl) params.append("podcast_url", podcastUrl);
  if (podcastScript) params.append("podcast_script", podcastScript);
  
  const response = await api.patch<SavedRepo>(`/api/v1/repos/${repoId}/podcast?${params.toString()}`);
  if ('_id' in response && !response.id) {
    response.id = (response as unknown as { _id: string })._id;
  }
  return response;
}

export default {
  saveRepository,
  listSavedRepos,
  getSavedRepo,
  deleteSavedRepo,
  updateRepoPodcast,
};
