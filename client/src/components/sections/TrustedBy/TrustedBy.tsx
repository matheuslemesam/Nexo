import { Container } from "../../ui";
import styles from "./TrustedBy.module.css";

const companies = [
  { name: "React", icon: "⚛️" },
  { name: "TypeScript", icon: "📘" },
  { name: "Python", icon: "🐍" },
  { name: "Node.js", icon: "🟢" },
  { name: "Go", icon: "🔵" },
];

export function TrustedBy() {
  return (
    <section className={styles.section}>
      <Container size='xl'>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Analyze repositories in
            <br />
            any language
          </h2>
          <p className={styles.subtitle}>
            Nexo supports analysis for multiple programming languages and frameworks,
            providing deep insights regardless of your tech stack.
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
          <span>JavaScript</span>
          <span>Java</span>
          <span>C++</span>
          <span>Rust</span>
          <span>Ruby</span>
          <span>PHP</span>
          <span>Swift</span>
          <span>Kotlin</span>
          <span>C#</span>
          <span>Vue.js</span>
          <span>Angular</span>
        </div>
      </Container>
    </section>
  );
}

export default TrustedBy;
