import { Container, Card } from "../../ui";
import styles from "./AgentOwlbert.module.css";

export function AgentOwlbert() {
  return (
    <section className={styles.section}>
      <Container size='xl'>
        <div className={styles.header}>
          <span className={styles.emoji}>🤖</span>
          <p className={styles.label}>Meet the</p>
          <h2 className={styles.title}>Nexo Agent</h2>
          <p className={styles.subtitle}>
            Your documentation assistant that analyzes code, suggests
            improvements and keeps everything synchronized automatically.
          </p>
          <a href='#' className={styles.link}>
            Learn more →
          </a>
        </div>

        <div className={styles.showcase}>
          <Card
            variant='elevated'
            padding='none'
            className={styles.previewCard}
          >
            <div className={styles.terminalWindow}>
              <div className={styles.terminalHeader}>
                <div className={styles.tabs}>
                  <span className={styles.tab}>Chat</span>
                  <span className={`${styles.tab} ${styles.activeTab}`}>
                    Editar
                  </span>
                  <span className={styles.tab}>+ Criar</span>
                </div>
              </div>
              <div className={styles.terminalBody}>
                <div className={styles.codeBlock}>
                  <p className={styles.heading}>## What It Does</p>
                  <p className={styles.text}>
                    Nexo Agent offers intelligent documentation:
                  </p>
                  <ul className={styles.list}>
                    <li>→ Automatic docs generation</li>
                    <li>→ Legacy code analysis</li>
                    <li>→ Real usage examples</li>
                    <li>→ Audio narration</li>
                  </ul>
                  <p className={styles.heading}>## Getting Started</p>
                  <p className={styles.text}>
                    Access the Agent via dashboard or CLI:
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className={styles.sidebar}>
            <Card
              variant='outlined'
              padding='md'
              className={styles.suggestionCard}
            >
              <div className={styles.suggestionIcon}>✨</div>
              <p className={styles.suggestionTitle}>Add code examples</p>
              <p className={styles.suggestionDesc}>
                Include usage snippets to ease understanding.
              </p>
            </Card>

            <Card
              variant='outlined'
              padding='md'
              className={styles.suggestionCard}
            >
              <div className={styles.suggestionIcon}>🔍</div>
              <p className={styles.suggestionTitle}>
                Outdated documentation detected
              </p>
              <p className={styles.suggestionDesc}>
                The Agent found functions without updated documentation.
              </p>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default AgentOwlbert;
