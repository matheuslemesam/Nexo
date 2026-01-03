import { api } from "./api";
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from "../types/auth";

const TOKEN_KEY = "nexo_token";
const USER_KEY = "nexo_user";

/**
 * Serviço de autenticação - comunica com o backend FastAPI
 */
export class AuthService {
  /**
   * Realiza login e armazena token
   */
  async login(
    credentials: LoginCredentials
  ): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post<AuthResponse>(
        "/api/v1/auth/login",
        credentials
      );

      const token = response.access_token;

      // Armazena token
      this.setToken(token);

      // Busca dados do usuário
      const user = await this.getCurrentUser(token);
      this.setUser(user);

      return { user, token };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Registra novo usuário
   */
  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    try {
      // 1. Registra usuário
      await api.post<User>("/api/v1/auth/register", data);

      // 2. Faz login automaticamente
      return await this.login({
        email: data.email,
        password: data.password,
      });
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Busca dados do usuário autenticado
   */
  async getCurrentUser(token?: string): Promise<User> {
    const authToken = token || this.getToken();

    if (!authToken) {
      throw new Error("Token não encontrado");
    }

    try {
      const user = await api.get<User>("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      return user;
    } catch (error) {
      // Se token inválido, limpa armazenamento
      if (error instanceof Error && error.message.includes("401")) {
        this.clearAuth();
      }
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout - limpa token e dados do usuário
   */
  logout(): void {
    this.clearAuth();
  }

  /**
   * Armazena token no localStorage
   */
  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Retorna token armazenado
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Armazena dados do usuário no localStorage
   */
  private setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  /**
   * Retorna usuário armazenado
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Limpa autenticação
   */
  private clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Verifica se está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Trata erros de autenticação
   */
  private handleAuthError(error: unknown): Error {
    if (error instanceof Error) {
      // Mensagens mais amigáveis
      if (
        error.message.includes("401") ||
        error.message.includes("credenciais")
      ) {
        return new Error("E-mail ou senha incorretos");
      }
      if (
        error.message.includes("400") ||
        error.message.includes("já existe")
      ) {
        return new Error("E-mail já cadastrado");
      }
      if (
        error.message.includes("422") ||
        error.message.includes("validation")
      ) {
        return new Error("Dados inválidos. Verifique os campos");
      }
      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        return new Error("Erro de conexão. Verifique sua internet");
      }

      return error;
    }

    return new Error("Erro desconhecido ao autenticar");
  }
}

export const authService = new AuthService();
