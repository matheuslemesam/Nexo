import { Container, Badge, Card } from "../../ui";
import styles from "./MCPServer.module.css";

export function MCPServer() {
  return (
    <section className={styles.section}>
      <Container size='xl'>
        <div className={styles.grid}>
          <div className={styles.content}>
            <Badge variant='primary'>CORE</Badge>
            <h2 className={styles.title}>
              Intelligent
              <br />
              Analysis
            </h2>
            <p className={styles.description}>
              Nexo automatically analyzes your code and generates clear,
              contextualized documentation.
            </p>
            <a href='#' className={styles.link}>
              Learn more →
            </a>
          </div>

          <div className={styles.imageWrapper}>
            <Card
              variant='elevated'
              padding='lg'
              className={styles.previewCard}
            >
              <div className={styles.mcpPreview}>
                <div className={styles.terminalHeader}>
                  <span
                    className={styles.dot}
                    style={{ background: "#ff5f56" }}
                  ></span>
                  <span
                    className={styles.dot}
                    style={{ background: "#ffbd2e" }}
                  ></span>
                  <span
                    className={styles.dot}
                    style={{ background: "#27ca3f" }}
                  ></span>
                </div>
                <div className={styles.mcpContent}>
                  <span className={styles.mcpLabel}>NEXO</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className={styles.features}>
          <Card variant='outlined' padding='lg' className={styles.featureCard}>
            <div className={styles.featureIcon}>🔍</div>
            <h3 className={styles.featureTitle}>Automatic Scanning</h3>
            <p className={styles.featureDesc}>
              Analyzes functions, classes and modules to extract context and
              purpose from code.
            </p>
          </Card>

          <Card variant='outlined' padding='lg' className={styles.featureCard}>
            <div className={styles.featureIcon}>📝</div>
            <h3 className={styles.featureTitle}>Generated Documentation</h3>
            <p className={styles.featureDesc}>
              Creates structured documentation that evolves along with your
              code.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}

export default MCPServer;
