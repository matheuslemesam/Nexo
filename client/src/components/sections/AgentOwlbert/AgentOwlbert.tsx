import { Container, Card } from '../../ui';
import styles from './AgentOwlbert.module.css';

export function AgentOwlbert() {
  return (
    <section className={styles.section}>
      <Container size="xl">
        <div className={styles.header}>
          <span className={styles.emoji}>🤖</span>
          <p className={styles.label}>Conheça o</p>
          <h2 className={styles.title}>Agente Nexo</h2>
          <p className={styles.subtitle}>
            Seu assistente de documentação que analisa o código, sugere melhorias e mantém tudo sincronizado automaticamente.
          </p>
          <a href="#" className={styles.link}>Saiba mais →</a>
        </div>

        <div className={styles.showcase}>
          <Card variant="elevated" padding="none" className={styles.previewCard}>
            <div className={styles.terminalWindow}>
              <div className={styles.terminalHeader}>
                <div className={styles.tabs}>
                  <span className={styles.tab}>Chat</span>
                  <span className={`${styles.tab} ${styles.activeTab}`}>Editar</span>
                  <span className={styles.tab}>+ Criar</span>
                </div>
              </div>
              <div className={styles.terminalBody}>
                <div className={styles.codeBlock}>
                  <p className={styles.heading}>## O Que Ele Faz</p>
                  <p className={styles.text}>O Agente Nexo oferece documentação inteligente:</p>
                  <ul className={styles.list}>
                    <li>→ Geração automática de docs</li>
                    <li>→ Análise de código legado</li>
                    <li>→ Exemplos de uso reais</li>
                    <li>→ Narração em áudio</li>
                  </ul>
                  <p className={styles.heading}>## Começando</p>
                  <p className={styles.text}>Acesse o Agente pelo dashboard ou CLI:</p>
                </div>
              </div>
            </div>
          </Card>

          <div className={styles.sidebar}>
            <Card variant="outlined" padding="md" className={styles.suggestionCard}>
              <div className={styles.suggestionIcon}>✨</div>
              <p className={styles.suggestionTitle}>Adicionar exemplos de código</p>
              <p className={styles.suggestionDesc}>Inclua snippets de uso para facilitar o entendimento.</p>
            </Card>

            <Card variant="outlined" padding="md" className={styles.suggestionCard}>
              <div className={styles.suggestionIcon}>🔍</div>
              <p className={styles.suggestionTitle}>Documentação desatualizada detectada</p>
              <p className={styles.suggestionDesc}>O Agente encontrou funções sem documentação atualizada.</p>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default AgentOwlbert;
