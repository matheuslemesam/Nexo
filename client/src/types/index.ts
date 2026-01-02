/**
 * Tipos e interfaces globais da aplicação
 * Organize tipos específicos em arquivos separados conforme necessário
 */

// Exemplo de tipo base para entidades com ID
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipo utilitário para respostas de API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Tipo para erros de API
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
