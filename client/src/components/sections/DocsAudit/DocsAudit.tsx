import { Container, Badge, Card } from "../../ui";
import styles from "./DocsAudit.module.css";

export function DocsAudit() {
  return (
    <section className={styles.section}>
      <Container size='xl'>
        <div className={styles.header}>
          <div className={styles.badges}>
            <Badge variant='primary'>NEW</Badge>
            <Badge>Full Project</Badge>
          </div>
          <h2 className={styles.title}>Docs Audit</h2>
          <p className={styles.subtitle}>
            Monitor documentation health across the entire project. Detect gaps
            and keep everything up to date.
          </p>
          <a href='#' className={styles.link}>
            Learn more →
          </a>
        </div>

        <div className={styles.preview}>
          <Card variant='elevated' padding='lg' className={styles.auditCard}>
            <div className={styles.auditList}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={styles.auditItem}>
                  <div className={styles.auditCheck}>{i <= 4 ? "✓" : "○"}</div>
                  <div className={styles.auditContent}>
                    <span className={styles.auditPage}>
                      {
                        [
                          "src/services/auth.ts",
                          "src/utils/helpers.ts",
                          "src/api/users.ts",
                          "src/models/product.ts",
                          "src/controllers/order.ts",
                          "src/middlewares/validate.ts",
                        ][i - 1]
                      }
                    </span>
                    <span className={styles.auditStatus}>
                      {i <= 4 ? "Documented" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className={styles.features}>
          <Card variant='outlined' padding='lg' className={styles.featureCard}>
            <div className={styles.featureIcon}>📝</div>
            <h3 className={styles.featureTitle}>Custom Rules</h3>
            <p className={styles.featureDesc}>
              Define documentation standards for your team and receive automatic
              alerts.
            </p>
          </Card>

          <Card variant='outlined' padding='lg' className={styles.featureCard}>
            <div className={styles.featureIcon}>📈</div>
            <h3 className={styles.featureTitle}>Coverage History</h3>
            <p className={styles.featureDesc}>
              Track documentation evolution over time and identify trends.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}

export default DocsAudit;
