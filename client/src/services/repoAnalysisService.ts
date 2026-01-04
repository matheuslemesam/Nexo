/**
 * Service para análise de repositórios
 * Consome o endpoint unificado /analyze/full
 */

import api from "./api";

// === Tipos para os dados do repositório ===

export interface RepoMetadata {
  name: string;
  full_name: string;
  description: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
  language: string | null;
  created_at: string;
  updated_at: string;
  size_kb: number;
  is_private: boolean;
  topics: string[];
}

export interface Contributor {
  username: string;
  avatar_url: string;
  contributions: number;
  profile_url: string;
}

export interface Branch {
  name: string;
  is_protected: boolean;
}

export interface RepositoryInfo {
  info: RepoMetadata | null;
  contributors: Contributor[];
  branches: {
    count: number;
    list: Branch[];
  };
  languages: Record<string, number>;
}

// === Tipos para análise de arquivos ===

export interface FileSummary {
  total_files: number;
  total_lines: number;
  total_size: string;
  files_in_context: number | null;
  total_analyzed: number | null;
}

export interface CategoryStats {
  processed: number;
  ignored: number;
  total_lines: number;
  size_bytes: number;
  extensions: Record<string, number>;
}

export interface FileAnalysis {
  summary: FileSummary;
  by_category: Record<string, CategoryStats>;
  top_extensions: Record<string, number>;
}

// === Tipos para dependências ===

export interface Dependency {
  manager: string;
  file: string;
  count: number;
  dependencies: string[];
  dev_dependencies: string[];
}

// === Tipos para contexto IA ===

export interface ContextInfo {
  payload: string;
  total_chars: number;
  estimated_tokens: number;
  max_chars: number;
  files_in_context: number;
  total_analyzed: number;
  included_files: string[];
}

// === Tipos para uso da API ===

export interface OverviewUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// === Resposta principal da análise ===

export interface AnalyzeResponse {
  status: "success" | "partial" | "error";
  repository: RepositoryInfo | null;
  file_analysis: FileAnalysis | null;
  dependencies: Dependency[];
  directory_structure: Record<string, unknown>;
  overview: string | null;
  overview_usage: OverviewUsage | null;
  context: ContextInfo | null;
  errors: string[] | null;
  overview_error: string | null;
}

// === Request ===

export interface AnalyzeRequest {
  github_url: string;
  branch?: string;
  token?: string;
}

// === Service ===

/**
 * Analisa um repositório de forma completa (extração + overview IA)
 * @param request Dados do repositório a ser analisado
 * @returns Dados completos da análise
 */
export async function analyzeRepository(
  request: AnalyzeRequest
): Promise<AnalyzeResponse> {
  return api.post<AnalyzeResponse>("/api/v1/analyze/full", {
    github_url: request.github_url,
    branch: request.branch || "main",
    token: request.token,
  });
}

/**
 * Helper para extrair linguagens como porcentagem
 * @param languages Mapa de linguagem -> bytes
 * @returns Array ordenado com porcentagens
 */
export function getLanguagesPercentage(
  languages: Record<string, number>
): { name: string; percentage: number; bytes: number }[] {
  const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
  if (total === 0) return [];

  return Object.entries(languages)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: Math.round((bytes / total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Helper para formatar data ISO para exibição
 * @param isoDate Data em formato ISO
 * @returns Data formatada para exibição
 */
export function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Helper para formatar números grandes
 * @param num Número a formatar
 * @returns String formatada (ex: 1.2k, 5.3M)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

// === Tipos e função para recursos de aprendizado ===

export interface LearningResource {
  type: "docs" | "article" | "video";
  title: string;
  url: string;
  description: string;
}

export interface TechnologyLearningResource {
  technology: string;
  icon: string;
  color: string;
  summary: string;
  resources: LearningResource[];
}

export interface LearningResourcesResponse {
  learning_resources: TechnologyLearningResource[];
  detected_technologies: string[];
}

/**
 * Busca recursos de aprendizado baseados nas tecnologias detectadas
 * @param technologies Lista de tecnologias (ex: ['TypeScript', 'React', 'FastAPI'])
 * @param repoContext Contexto opcional do repositório
 * @returns Promise com os recursos de aprendizado
 */
export async function getLearningResources(
  technologies: string[],
  repoContext?: string
): Promise<LearningResourcesResponse> {
  const params = new URLSearchParams({
    technologies: technologies.join(","),
  });

  if (repoContext) {
    params.append("repo_context", repoContext);
  }

  const response = await api.get(
    `/api/v1/learning-resources?${params.toString()}`
  );
  return response.data;
}

export default {
  analyzeRepository,
  getLanguagesPercentage,
  formatDate,
  formatNumber,
  getLearningResources,
};
