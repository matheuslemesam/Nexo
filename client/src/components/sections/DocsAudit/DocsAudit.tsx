import { Container, Badge, Card } from '../../ui';
import styles from './DocsAudit.module.css';

export function DocsAudit() {
  return (
    <section className={styles.section}>
      <Container size="xl">
        <div className={styles.header}>
          <div className={styles.badges}>
            <Badge variant="primary">NOVO</Badge>
            <Badge>Projeto Completo</Badge>
          </div>
          <h2 className={styles.title}>Auditoria de Docs</h2>
          <p className={styles.subtitle}>
            Monitore a saúde da documentação em todo o projeto. Detecte gaps e mantenha tudo atualizado.
          </p>
          <a href="#" className={styles.link}>Saiba mais →</a>
        </div>

        <div className={styles.preview}>
          <Card variant="elevated" padding="lg" className={styles.auditCard}>
            <div className={styles.auditList}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={styles.auditItem}>
                  <div className={styles.auditCheck}>
                    {i <= 4 ? '✓' : '○'}
                  </div>
                  <div className={styles.auditContent}>
                    <span className={styles.auditPage}>{['src/services/auth.ts', 'src/utils/helpers.ts', 'src/api/users.ts', 'src/models/product.ts', 'src/controllers/order.ts', 'src/middlewares/validate.ts'][i-1]}</span>
                    <span className={styles.auditStatus}>
                      {i <= 4 ? 'Documentado' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className={styles.features}>
          <Card variant="outlined" padding="lg" className={styles.featureCard}>
            <div className={styles.featureIcon}>📝</div>
            <h3 className={styles.featureTitle}>Regras Personalizadas</h3>
            <p className={styles.featureDesc}>
              Defina padrões de documentação para seu time e receba alertas automáticos.
            </p>
          </Card>

          <Card variant="outlined" padding="lg" className={styles.featureCard}>
            <div className={styles.featureIcon}>📈</div>
            <h3 className={styles.featureTitle}>Histórico de Cobertura</h3>
            <p className={styles.featureDesc}>
              Acompanhe a evolução da documentação ao longo do tempo e identifique tendências.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}

export default DocsAudit;
