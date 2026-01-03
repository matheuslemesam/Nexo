import { Container } from "../../ui";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container size='xl'>
        <div className={styles.cta}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🔗</span>
            <span className={styles.logoText}>Nexo</span>
          </div>
          <h2 className={styles.ctaTitle}>
            Documented code,
            <br />
            <span className={styles.highlight}>productive</span> team
          </h2>
          <div className={styles.ctaButtons}>
            <button className={styles.primaryBtn}>Get started now</button>
            <button className={styles.secondaryBtn}>View documentation</button>
          </div>
        </div>

        <div className={styles.links}>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Product</h3>
            <ul>
              <li>
                <a href='#'>Features</a>
              </li>
              <li>
                <a href='#'>Dashboard</a>
              </li>
              <li>
                <a href='#'>Integrations</a>
              </li>
              <li>
                <a href='#'>API</a>
              </li>
              <li>
                <a href='#'>Enterprise</a>
              </li>
              <li>
                <a href='#'>Pricing</a>
              </li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Resources</h3>
            <ul>
              <li>
                <a href='#'>Use Cases</a>
              </li>
              <li>
                <a href='#'>Tutorials</a>
              </li>
              <li>
                <a href='#'>Changelog</a>
              </li>
              <li>
                <a href='#'>Blog</a>
              </li>
              <li>
                <a href='#'>Documentation</a>
              </li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Company</h3>
            <ul>
              <li>
                <a href='#'>About Us</a>
              </li>
              <li>
                <a href='#'>Careers</a>
              </li>
              <li>
                <a href='#'>Contact</a>
              </li>
              <li>
                <a href='#'>Support</a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Nexo. All rights reserved.
          </p>
          <div className={styles.legal}>
            <a href='#'>Privacy Policy</a>
            <a href='#'>Terms of Use</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
