import { Container, Badge, Card } from "../../ui";
import styles from "./AILinter.module.css";

export function AILinter() {
  return (
    <section className={styles.section}>
      <Container size='xl'>
        <div className={styles.grid}>
          <div className={styles.preview}>
            <Card variant='elevated' padding='md' className={styles.editorCard}>
              <div className={styles.editor}>
                <div className={styles.lineNumbers}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <span key={n}>{n}</span>
                  ))}
                </div>
                <div className={styles.code}>
                  <p>## Começando</p>
                  <p>&nbsp;</p>
                  <p>Para começar a usar a API, vc</p>
                  <p className={styles.errorLine}>
                    precisa <span className={styles.error}>autentikar</span>
                  </p>
                  <p>primeiro usando sua chave.</p>
                  <p>&nbsp;</p>
                  <p>
                    A API é <span className={styles.warning}>muito</span> fácil
                  </p>
                  <p>de usar com muitos recursos.</p>
                </div>
              </div>
              <div className={styles.linterPopup}>
                <div className={styles.popupHeader}>
                  <span className={styles.warningIcon}>⚠️</span>
                  <span>Erro de digitação</span>
                </div>
                <p className={styles.popupText}>
                  Você quis dizer "autenticar"?
                </p>
                <button className={styles.fixButton}>Corrigir</button>
              </div>
            </Card>
          </div>

          <div className={styles.content}>
            <div className={styles.badges}>
              <Badge variant='primary'>NEW</Badge>
              <Badge variant='secondary'>AI Integrated</Badge>
            </div>
            <h2 className={styles.title}>Intelligent Reviewer</h2>
            <p className={styles.description}>
              Fix errors and enhance documentation with an AI reviewer
              integrated into your workflow.
            </p>

            <ul className={styles.features}>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Fixes typos
              </li>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Checks tone consistency
              </li>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Detects verbose text
              </li>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Suggests clarity improvements
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.cards}>
          <Card variant='outlined' padding='lg' className={styles.featureCard}>
            <div className={styles.featureIcon}>🔧</div>
            <h3 className={styles.featureTitle}>Automatic Correction</h3>
            <p className={styles.featureDesc}>
              The Nexo Agent can edit content and fix problems automatically.
            </p>
          </Card>

          <Card variant='outlined' padding='lg' className={styles.featureCard}>
            <div className={styles.featureIcon}>🚀</div>
            <h3 className={styles.featureTitle}>Review Before Publishing</h3>
            <p className={styles.featureDesc}>
              The reviewer runs before each commit to ensure quality
              documentation.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}

export default AILinter;
