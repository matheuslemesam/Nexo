import { Container, Badge, Card } from '../../ui';
import styles from './AILinter.module.css';

export function AILinter() {
  return (
    <section className={styles.section}>
      <Container size="xl">
        <div className={styles.grid}>
          <div className={styles.preview}>
            <Card variant="elevated" padding="md" className={styles.editorCard}>
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
                  <p className={styles.errorLine}>precisa <span className={styles.error}>autentikar</span></p>
                  <p>primeiro usando sua chave.</p>
                  <p>&nbsp;</p>
                  <p>A API é <span className={styles.warning}>muito</span> fácil</p>
                  <p>de usar com muitos recursos.</p>
                </div>
              </div>
              <div className={styles.linterPopup}>
                <div className={styles.popupHeader}>
                  <span className={styles.warningIcon}>⚠️</span>
                  <span>Erro de digitação</span>
                </div>
                <p className={styles.popupText}>Você quis dizer "autenticar"?</p>
                <button className={styles.fixButton}>Corrigir</button>
              </div>
            </Card>
          </div>

          <div className={styles.content}>
            <div className={styles.badges}>
              <Badge variant="primary">NOVO</Badge>
              <Badge variant="secondary">IA Integrada</Badge>
            </div>
            <h2 className={styles.title}>Revisor Inteligente</h2>
            <p className={styles.description}>
              Corrija erros e aprimore a documentação com um revisor de IA integrado ao seu workflow.
            </p>

            <ul className={styles.features}>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Corrige erros de digitação
              </li>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Verifica consistência de tom
              </li>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Detecta texto prolixo
              </li>
              <li>
                <span className={styles.checkIcon}>✓</span>
                Sugere melhorias de clareza
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.cards}>
          <Card variant="outlined" padding="lg" className={styles.featureCard}>
            <div className={styles.featureIcon}>🔧</div>
            <h3 className={styles.featureTitle}>Correção Automática</h3>
            <p className={styles.featureDesc}>
              O Agente Nexo pode editar o conteúdo e corrigir problemas automaticamente.
            </p>
          </Card>

          <Card variant="outlined" padding="lg" className={styles.featureCard}>
            <div className={styles.featureIcon}>🚀</div>
            <h3 className={styles.featureTitle}>Revisão Antes de Publicar</h3>
            <p className={styles.featureDesc}>
              O revisor roda antes de cada commit para garantir documentação de qualidade.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}

export default AILinter;
