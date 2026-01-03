import { Container, Card } from "../../ui";
import styles from "./AskAI.module.css";

export function AskAI() {
  return (
    <section className={styles.section}>
      <Container size='xl'>
        <div className={styles.header}>
          <h2 className={styles.title}>Ask the Code</h2>
          <p className={styles.subtitle}>
            Chat with your project. Ask questions and receive contextualized
            answers about any part of the code.
          </p>
          <a href='#' className={styles.link}>
            See how it works →
          </a>
        </div>

        <div className={styles.showcase}>
          <Card variant='elevated' padding='none' className={styles.chatCard}>
            <div className={styles.chatWindow}>
              <div className={styles.chatHeader}>
                <span className={styles.aiIcon}>🤖</span>
                <span>Nexo Chat</span>
              </div>
              <div className={styles.chatBody}>
                <div className={styles.messageUser}>
                  What does the processPayment function do?
                </div>
                <div className={styles.messageAI}>
                  The processPayment function validates card data, connects to
                  the payment gateway and returns the transaction status. It's
                  located in src/services/payment.ts...
                </div>
              </div>
              <div className={styles.chatInput}>
                <input
                  type='text'
                  placeholder='Ask anything about the code...'
                />
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.features}>
          <Card variant='outlined' padding='lg' className={styles.featureCard}>
            <div className={styles.featureIcon}>💬</div>
            <h3 className={styles.featureTitle}>Accelerated Onboarding</h3>
            <p className={styles.featureDesc}>
              New developers understand the project in hours, not weeks. Ask and
              learn.
            </p>
          </Card>

          <Card variant='outlined' padding='lg' className={styles.featureCard}>
            <div className={styles.featureIcon}>🧠</div>
            <h3 className={styles.featureTitle}>Complete Context</h3>
            <p className={styles.featureDesc}>
              Answers based on real code, not generic assumptions.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}

export default AskAI;
