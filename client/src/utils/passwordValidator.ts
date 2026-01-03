import type { PasswordValidation } from "../types/auth";

/**
 * Valida a força da senha conforme regras do backend:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let strength: PasswordValidation["strength"] = "weak";

  // Validações obrigatórias (mesmas do backend)
  if (password.length < 8) {
    errors.push("A senha deve ter pelo menos 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra maiúscula");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("A senha deve conter pelo menos uma letra minúscula");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("A senha deve conter pelo menos um número");
  }

  // Cálculo de força
  let strengthScore = 0;

  if (password.length >= 8) strengthScore++;
  if (password.length >= 12) strengthScore++;
  if (/[A-Z]/.test(password)) strengthScore++;
  if (/[a-z]/.test(password)) strengthScore++;
  if (/[0-9]/.test(password)) strengthScore++;
  if (/[^A-Za-z0-9]/.test(password)) strengthScore++; // Caracteres especiais (opcional, mas aumenta força)

  if (strengthScore <= 2) {
    strength = "weak";
  } else if (strengthScore <= 4) {
    strength = "medium";
  } else if (strengthScore <= 5) {
    strength = "strong";
  } else {
    strength = "very-strong";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Retorna cor e label baseado na força da senha
 */
export function getPasswordStrengthDisplay(
  strength: PasswordValidation["strength"]
) {
  switch (strength) {
    case "weak":
      return { label: "Fraca", color: "#ef4444", percentage: 25 };
    case "medium":
      return { label: "Média", color: "#f59e0b", percentage: 50 };
    case "strong":
      return { label: "Forte", color: "#10b981", percentage: 75 };
    case "very-strong":
      return { label: "Muito Forte", color: "#059669", percentage: 100 };
  }
}
