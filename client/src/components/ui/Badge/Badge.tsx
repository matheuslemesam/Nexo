import type { ReactNode } from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'sm',
  className = '' 
}: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${styles[size]} ${className}`}>
      {children}
    </span>
  );
}

export default Badge;
