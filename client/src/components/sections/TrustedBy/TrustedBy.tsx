import { Container } from '../../ui';
import styles from './TrustedBy.module.css';

const companies = [
  { name: 'Startups', icon: '🚀' },
  { name: 'Enterprise', icon: '🏢' },
  { name: 'Agências', icon: '💼' },
  { name: 'Open Source', icon: '🌐' },
  { name: 'DevOps', icon: '⚙️' },
];

export function TrustedBy() {
  return (
    <section className={styles.section}>
      <Container size="xl">
        <div className={styles.header}>
          <h2 className={styles.title}>
            Quer escalar sua
            <br />
            documentação?
          </h2>
          <p className={styles.subtitle}>
            Times de todos os tamanhos usam Nexo para transformar código legado em conhecimento acessível.
          </p>
        </div>

        <div className={styles.companies}>
          {companies.map((company) => (
            <div key={company.name} className={styles.company}>
              <span className={styles.companyIcon}>{company.icon}</span>
              <span className={styles.companyName}>{company.name}</span>
            </div>
          ))}
        </div>

        <div className={styles.moreLogos}>
          <span>Nubank</span>
          <span>iFood</span>
          <span>Stone</span>
          <span>Mercado Livre</span>
          <span>PagSeguro</span>
          <span>QuintoAndar</span>
          <span>Creditas</span>
          <span>Loft</span>
          <span>Loggi</span>
          <span>99</span>
          <span>EBANX</span>
        </div>
      </Container>
    </section>
  );
}

export default TrustedBy;
