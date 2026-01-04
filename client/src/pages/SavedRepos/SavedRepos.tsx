import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../../components/layout";
import { Container, Card } from "../../components/ui";
import styles from "./SavedRepos.module.css";
import { listSavedRepos, deleteSavedRepo, type SavedRepoSummary } from "../../services/savedReposService";
import { useAuth } from "../../hooks";

export function SavedRepos() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [repos, setRepos] = useState<SavedRepoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }

    if (isAuthenticated) {
      loadRepos();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const loadRepos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listSavedRepos(0, 50);
      setRepos(response.repos);
    } catch (err) {
      setError("Error loading saved repositories");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (repoId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to remove this repository?")) {
      return;
    }
    
    try {
      setDeletingId(repoId);
      await deleteSavedRepo(repoId);
      setRepos(repos.filter(r => r.id !== repoId));
    } catch (err) {
      console.error("Error deleting repo:", err);
      alert("Error removing repository");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <Container>
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading repositories...</p>
            </div>
          </Container>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <Container>
          <div className={styles.header}>
            <h1 className={styles.title}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              My Saved Repositories
            </h1>
            <p className={styles.subtitle}>
              {repos.length} {repos.length === 1 ? "repository" : "repositories"} saved
            </p>
          </div>

          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={loadRepos}>Try again</button>
            </div>
          )}

          {!error && repos.length === 0 && (
            <Card className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3>No saved repositories</h3>
              <p>When you analyze repositories, they will be automatically saved here.</p>
              <Link to="/comecar" className={styles.ctaButton}>
                Analyze a Repository
              </Link>
            </Card>
          )}

          {repos.length > 0 && (
            <div className={styles.repoGrid}>
              {repos.map((repo) => (
                <Link
                  key={repo.id}
                  to={`/analise?repo=${encodeURIComponent(repo.repo_url)}&saved=${repo.id}`}
                  className={styles.repoCard}
                >
                  <div className={styles.repoHeader}>
                    <div className={styles.repoIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                      </svg>
                    </div>
                    <div className={styles.repoInfo}>
                      <h3 className={styles.repoName}>{repo.repo_full_name}</h3>
                      {repo.description && (
                        <p className={styles.repoDescription}>{repo.description}</p>
                      )}
                    </div>
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => handleDelete(repo.id, e)}
                      disabled={deletingId === repo.id}
                      title="Remove repository"
                    >
                      {deletingId === repo.id ? (
                        <span className={styles.miniSpinner}></span>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className={styles.repoMeta}>
                    {repo.language && (
                      <span className={styles.language}>
                        <span className={styles.languageDot} style={{ backgroundColor: getLanguageColor(repo.language) }}></span>
                        {repo.language}
                      </span>
                    )}
                    <span className={styles.stars}>
                      ⭐ {repo.stars}
                    </span>
                    <span className={styles.forks}>
                      🍴 {repo.forks}
                    </span>
                  </div>

                  <div className={styles.repoFooter}>
                    <div className={styles.badges}>
                      {repo.has_overview && (
                        <span className={styles.badge}>📝 Overview</span>
                      )}
                      {repo.has_podcast && (
                        <span className={styles.badge}>🎙️ Podcast</span>
                      )}
                    </div>
                    <span className={styles.date}>
                      Saved on {formatDate(repo.created_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </main>
    </>
  );
}

// Helper for language colors
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Java: "#b07219",
    Go: "#00ADD8",
    Rust: "#dea584",
    C: "#555555",
    "C++": "#f34b7d",
    "C#": "#178600",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#ffac45",
    Kotlin: "#A97BFF",
  };
  return colors[language] || "#6e7681";
}

export default SavedRepos;
