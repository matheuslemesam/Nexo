import { Container, Badge, Card } from '../../ui';
import styles from './MCPServer.module.css';

export function MCPServer() {
  return (
    <section className={styles.section}>
      <Container size="xl">
        <div className={styles.grid}>
          <div className={styles.content}>
            <Badge variant="primary">CORE</Badge>
            <h2 className={styles.title}>
              Análise
              <br />
              Inteligente
            </h2>
            <p className={styles.description}>
              O Nexo analisa seu código automaticamente e gera documentação clara e contextualizada.
            </p>
            <a href="#" className={styles.link}>
              Saiba mais →
            </a>
          </div>

          <div className={styles.imageWrapper}>
            <Card variant="elevated" padding="lg" className={styles.previewCard}>
              <div className={styles.mcpPreview}>
                <div className={styles.terminalHeader}>
                  <span className={styles.dot} style={{ background: '#ff5f56' }}></span>
                  <span className={styles.dot} style={{ background: '#ffbd2e' }}></span>
                  <span className={styles.dot} style={{ background: '#27ca3f' }}></span>
                </div>
                <div className={styles.mcpContent}>
                  <span className={styles.mcpLabel}>NEXO</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className={styles.features}>
          <Card variant="outlined" padding="lg" className={styles.featureCard}>
            <div className={styles.featureIcon}>🔍</div>
            <h3 className={styles.featureTitle}>Escaneamento Automático</h3>
            <p className={styles.featureDesc}>
              Analisa funções, classes e módulos para extrair contexto e propósito do código.
            </p>
          </Card>

          <Card variant="outlined" padding="lg" className={styles.featureCard}>
            <div className={styles.featureIcon}>📝</div>
            <h3 className={styles.featureTitle}>Documentação Gerada</h3>
            <p className={styles.featureDesc}>
              Cria documentação estruturada que evolui junto com seu código.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}

export default MCPServer;
