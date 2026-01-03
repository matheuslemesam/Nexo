import { Container } from '../../ui';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container size="xl">
        <div className={styles.cta}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🔗</span>
            <span className={styles.logoText}>Nexo</span>
          </div>
          <h2 className={styles.ctaTitle}>
            Código documentado,
            <br />
            time <span className={styles.highlight}>produtivo</span>
          </h2>
          <div className={styles.ctaButtons}>
            <button className={styles.primaryBtn}>Começar agora</button>
            <button className={styles.secondaryBtn}>Ver documentação</button>
          </div>
        </div>

        <div className={styles.links}>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Produto</h3>
            <ul>
              <li><a href="#">Funcionalidades</a></li>
              <li><a href="#">Dashboard</a></li>
              <li><a href="#">Integrações</a></li>
              <li><a href="#">API</a></li>
              <li><a href="#">Enterprise</a></li>
              <li><a href="#">Preços</a></li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Recursos</h3>
            <ul>
              <li><a href="#">Casos de Uso</a></li>
              <li><a href="#">Tutoriais</a></li>
              <li><a href="#">Changelog</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Documentação</a></li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Empresa</h3>
            <ul>
              <li><a href="#">Sobre Nós</a></li>
              <li><a href="#">Carreiras</a></li>
              <li><a href="#">Contato</a></li>
              <li><a href="#">Suporte</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Nexo. Todos os direitos reservados.
          </p>
          <div className={styles.legal}>
            <a href="#">Política de Privacidade</a>
            <a href="#">Termos de Uso</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
