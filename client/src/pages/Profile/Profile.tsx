import { useAuth } from "../../hooks";
import { Navbar } from "../../components/layout";
import { Container } from "../../components/ui";
import { Navigate } from "react-router-dom";
import styles from "./Profile.module.css";

export function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <Container size='md'>
          <div className={styles.loading}>Loading...</div>
        </Container>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to='/login' replace />;
  }

  // Generate avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      "#667eea",
      "#764ba2",
      "#f093fb",
      "#4facfe",
      "#43e97b",
      "#fa709a",
      "#fee140",
      "#30cfd0",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <Container size='md'>
          <div className={styles.content}>
            <h1 className={styles.title}>My Profile</h1>

            <div className={styles.profileCard}>
              {/* Header with Avatar */}
              <div className={styles.profileHeader}>
                <div
                  className={styles.avatar}
                  style={{ backgroundColor: getAvatarColor(user.name) }}
                >
                  {getInitials(user.name)}
                </div>
                <div className={styles.headerInfo}>
                  <h2 className={styles.userName}>{user.name}</h2>
                  <p className={styles.userEmail}>{user.email}</p>
                </div>
              </div>

              {/* Information */}
              <div className={styles.infoSection}>
                <h3 className={styles.sectionTitle}>Account Information</h3>

                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Full Name</span>
                    <span className={styles.infoValue}>{user.name}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>{user.email}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Status</span>
                    <span className={styles.infoBadge}>
                      {user.is_active ? (
                        <span className={styles.badgeActive}>Active</span>
                      ) : (
                        <span className={styles.badgeInactive}>Inactive</span>
                      )}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Member Since</span>
                    <span className={styles.infoValue}>
                      {formatDate(user.created_at)}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>User ID</span>
                    <span className={styles.infoValueMono}>{user._id}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <button className={styles.primaryButton}>
                  <svg
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
                    <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
                  </svg>
                  Edit Profile
                </button>
                <button className={styles.secondaryButton}>
                  <svg
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
                    <path d='M7 11V7a5 5 0 0 1 10 0v4' />
                  </svg>
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
