import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Conteúdo do botão */
  children: ReactNode;
  /** Variante visual do botão */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Tamanho do botão */
  size?: 'sm' | 'md' | 'lg';
  /** Estado de carregamento */
  isLoading?: boolean;
  /** Ocupar toda a largura disponível */
  fullWidth?: boolean;
}

/**
 * Componente de botão reutilizável com múltiplas variantes
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    isLoading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : null}
      <span className={isLoading ? styles.hiddenText : ''}>{children}</span>
    </button>
  );
}

export default Button;
