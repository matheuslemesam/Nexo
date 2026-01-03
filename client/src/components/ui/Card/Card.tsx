import type { ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md' 
}: CardProps) {
  return (
    <div className={`${styles.card} ${styles[variant]} ${styles[`padding-${padding}`]} ${className}`}>
      {children}
    </div>
  );
}

export default Card;
