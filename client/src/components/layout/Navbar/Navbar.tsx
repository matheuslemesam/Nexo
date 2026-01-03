import styles from './Navbar.module.css';
import { Container } from '../../ui';

export function Navbar() {
  return (
    <header className={styles.header}>
      <Container size="xl">
        <nav className={styles.nav}>
          <div className={styles.logo}>
            <img
              src="/logo.svg"
              alt="Logo"
              className={styles.logoIcon}
            />
            <span className={styles.logoText}>Nexo</span>
          </div>

          <div className={styles.links}>
            <a href="#features" className={styles.link}>Funcionalidades</a>
            <a href="#ai" className={styles.link}>IA</a>
            <a href="#docs" className={styles.link}>Docs</a>
            <a href="#pricing" className={styles.link}>Preços</a>
          </div>

          <div className={styles.actions}>
            <a href="#contact" className={styles.link}>Contato</a>
            <a href="#login" className={styles.link}>Entrar</a>
            <button className={styles.tryButton}>Experimente</button>
          </div>
        </nav>
      </Container>
    </header>
  );
}

export default Navbar;
