import type { ReactNode } from 'react';
import styles from './Container.module.css';

export interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Container({ children, className = '', size = 'lg' }: ContainerProps) {
  return (
    <div className={`${styles.container} ${styles[size]} ${className}`}>
      {children}
    </div>
  );
}

export default Container;
