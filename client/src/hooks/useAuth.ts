import { useContext } from "react";
import { AuthContext } from "../contexts";

/**
 * Hook para usar autenticação
 * Separado em arquivo próprio para evitar problemas com Fast Refresh
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
