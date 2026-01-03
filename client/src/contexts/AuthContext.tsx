import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type {
  AuthContextType,
  User,
  LoginCredentials,
  RegisterData,
} from "../types/auth";
import { authService } from "../services/authService";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de autenticação - gerencia estado global do usuário
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura sessão ao carregar a aplicação
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authService.getToken();
      const storedUser = authService.getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        // Valida token no backend
        try {
          const freshUser = await authService.getCurrentUser(storedToken);
          setUser(freshUser);
        } catch (error) {
          // Token inválido/expirado - faz logout
          console.error("Token inválido:", error);
          authService.logout();
          setToken(null);
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Realiza login
   */
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { user: loggedUser, token: authToken } = await authService.login(
        credentials
      );
      setUser(loggedUser);
      setToken(authToken);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Registra novo usuário
   */
  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const { user: newUser, token: authToken } = await authService.register(
        data
      );
      setUser(newUser);
      setToken(authToken);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  /**
   * Atualiza dados do usuário
   */
  const refreshUser = async () => {
    if (!token) return;

    try {
      const freshUser = await authService.getCurrentUser(token);
      setUser(freshUser);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Context exportado para uso com useContext diretamente se necessário
export { AuthContext };
