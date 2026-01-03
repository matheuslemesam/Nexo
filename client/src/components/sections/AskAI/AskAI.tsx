import { Container, Card } from '../../ui';
import styles from './AskAI.module.css';

export function AskAI() {
  return (
    <section className={styles.section}>
      <Container size="xl">
        <div className={styles.header}>
          <h2 className={styles.title}>Pergunte ao Código</h2>
          <p className={styles.subtitle}>
            Converse com seu projeto. Faça perguntas e receba respostas contextualizadas sobre qualquer parte do código.
          </p>
          <a href="#" className={styles.link}>Ver como funciona →</a>
        </div>

        <div className={styles.showcase}>
          <Card variant="elevated" padding="none" className={styles.chatCard}>
            <div className={styles.chatWindow}>
              <div className={styles.chatHeader}>
                <span className={styles.aiIcon}>🤖</span>
                <span>Nexo Chat</span>
              </div>
              <div className={styles.chatBody}>
                <div className={styles.messageUser}>
                  O que faz a função processPayment?
                </div>
                <div className={styles.messageAI}>
                  A função processPayment valida os dados do cartão, conecta com o gateway de pagamento e retorna o status da transação. Ela está em src/services/payment.ts...
                </div>
              </div>
              <div className={styles.chatInput}>
                <input type="text" placeholder="Pergunte qualquer coisa sobre o código..." />
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.features}>
          <Card variant="outlined" padding="lg" className={styles.featureCard}>
            <div className={styles.featureIcon}>💬</div>
            <h3 className={styles.featureTitle}>Onboarding Acelerado</h3>
            <p className={styles.featureDesc}>
              Novos devs entendem o projeto em horas, não semanas. Pergunte e aprenda.
            </p>
          </Card>

          <Card variant="outlined" padding="lg" className={styles.featureCard}>
            <div className={styles.featureIcon}>🧠</div>
            <h3 className={styles.featureTitle}>Contexto Completo</h3>
            <p className={styles.featureDesc}>
              Respostas baseadas no código real, não em suposições genéricas.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}

export default AskAI;
