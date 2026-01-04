import { Container, Badge, Card } from "../../ui";
import styles from "./DocsAudit.module.css";

export function DocsAudit() {
  return (
    <section className={styles.section}>
      <Container size='xl'>
        <div className={styles.header}>
          <div className={styles.badges}>
            <Badge variant='primary'>Authenticated</Badge>
            <Badge>Feature</Badge>
          </div>
          <h2 className={styles.title}>Save Your Favorite Repositories</h2>
          <p className={styles.subtitle}>
            Sign up to Nexo and never lose your AI-generated 
            insights and podcasts again.
          </p>
          <a href='/register' className={styles.link}>
            Create Free Account →
          </a>
        </div>

        <div className={styles.preview}>
          <Card variant='elevated' padding='lg' className={styles.auditCard}>
            <div className={styles.auditList}>
              {[
                { name: "facebook/react", star: true, podcast: true },
                { name: "vercel/next.js", star: true, podcast: true },
                { name: "microsoft/vscode", star: true, podcast: false },
                { name: "nodejs/node", star: true, podcast: true },
                { name: "torvalds/linux", star: false, podcast: false },
                { name: "tensorflow/tensorflow", star: false, podcast: false },
              ].map((repo, i) => (
                <div key={i} className={styles.auditItem}>
                  <div className={styles.auditCheck}>
                    {repo.star ? "⭐" : "☆"}
                  </div>
                  <div className={styles.auditContent}>
                    <span className={styles.auditPage}>{repo.name}</span>
                    <div className={styles.auditBadges}>
                      {repo.podcast && (
                        <span className={styles.podcastBadge}>🎙️ Podcast</span>
                      )}
                      <span className={styles.auditStatus}>
                        {repo.star ? "Saved" : "Not Saved"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className={styles.features}>
          <Card variant='outlined' padding='lg' className={styles.featureCard}>
            <div className={styles.featureIcon}>💾</div>
            <h3 className={styles.featureTitle}>Quick Access</h3>
            <p className={styles.featureDesc}>
              Access your saved repositories from anywhere. All your analysis 
              data and podcasts in one place.
            </p>
          </Card>

          <Card variant='outlined' padding='lg' className={styles.featureCard}>
            <div className={styles.featureIcon}>🎧</div>
            <h3 className={styles.featureTitle}>Keep Your Podcasts</h3>
            <p className={styles.featureDesc}>
              AI-generated podcasts are automatically saved with your repositories. 
              Listen anytime, anywhere.
            </p>
          </Card>
        </div>
      </Container>
    </section>
  );
}

export default DocsAudit;
