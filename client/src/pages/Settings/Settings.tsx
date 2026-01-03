import { useAuth, useTheme } from "../../hooks";
import { Navbar } from "../../components/layout";
import { Container } from "../../components/ui";
import { Navigate } from "react-router-dom";
import styles from "./Settings.module.css";

export function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <Container size='md'>
          <div className={styles.loading}>Carregando...</div>
        </Container>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to='/login' replace />;
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <Container size='md'>
          <div className={styles.content}>
            <h1 className={styles.title}>Configurações</h1>

            {/* Aparência */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <circle cx='12' cy='12' r='5' />
                    <line x1='12' y1='1' x2='12' y2='3' />
                    <line x1='12' y1='21' x2='12' y2='23' />
                    <line x1='4.22' y1='4.22' x2='5.64' y2='5.64' />
                    <line x1='18.36' y1='18.36' x2='19.78' y2='19.78' />
                    <line x1='1' y1='12' x2='3' y2='12' />
                    <line x1='21' y1='12' x2='23' y2='12' />
                    <line x1='4.22' y1='19.78' x2='5.64' y2='18.36' />
                    <line x1='18.36' y1='5.64' x2='19.78' y2='4.22' />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Aparência</h2>
                  <p className={styles.sectionDescription}>
                    Personalize a aparência da aplicação
                  </p>
                </div>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>Modo Escuro</h3>
                  <p className={styles.settingDescription}>
                    Alterna entre tema claro e escuro
                  </p>
                </div>
                <button
                  className={`${styles.toggle} ${
                    theme === "dark" ? styles.toggleActive : ""
                  }`}
                  onClick={toggleTheme}
                  aria-label='Alternar tema'
                >
                  <span className={styles.toggleSlider}>
                    {theme === "dark" ? (
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                      >
                        <path d='M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' />
                      </svg>
                    ) : (
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                      >
                        <circle cx='12' cy='12' r='5' />
                        <line
                          x1='12'
                          y1='1'
                          x2='12'
                          y2='3'
                          stroke='currentColor'
                          strokeWidth='2'
                        />
                        <line
                          x1='12'
                          y1='21'
                          x2='12'
                          y2='23'
                          stroke='currentColor'
                          strokeWidth='2'
                        />
                        <line
                          x1='4.22'
                          y1='4.22'
                          x2='5.64'
                          y2='5.64'
                          stroke='currentColor'
                          strokeWidth='2'
                        />
                        <line
                          x1='18.36'
                          y1='18.36'
                          x2='19.78'
                          y2='19.78'
                          stroke='currentColor'
                          strokeWidth='2'
                        />
                        <line
                          x1='1'
                          y1='12'
                          x2='3'
                          y2='12'
                          stroke='currentColor'
                          strokeWidth='2'
                        />
                        <line
                          x1='21'
                          y1='12'
                          x2='23'
                          y2='12'
                          stroke='currentColor'
                          strokeWidth='2'
                        />
                        <line
                          x1='4.22'
                          y1='19.78'
                          x2='5.64'
                          y2='18.36'
                          stroke='currentColor'
                          strokeWidth='2'
                        />
                        <line
                          x1='18.36'
                          y1='5.64'
                          x2='19.78'
                          y2='4.22'
                          stroke='currentColor'
                          strokeWidth='2'
                        />
                      </svg>
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* Notificações */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' />
                    <path d='M13.73 21a2 2 0 0 1-3.46 0' />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Notificações</h2>
                  <p className={styles.sectionDescription}>
                    Gerencie suas preferências de notificação
                  </p>
                </div>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>
                    Notificações por E-mail
                  </h3>
                  <p className={styles.settingDescription}>
                    Receba atualizações importantes por e-mail
                  </p>
                </div>
                <button
                  className={`${styles.toggle} ${styles.toggleActive}`}
                  disabled
                >
                  <span className={styles.toggleSlider}>
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='3'
                    >
                      <polyline points='20 6 9 17 4 12' />
                    </svg>
                  </span>
                </button>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>Notificações Push</h3>
                  <p className={styles.settingDescription}>
                    Receba notificações no navegador
                  </p>
                </div>
                <button className={styles.toggle} disabled>
                  <span className={styles.toggleSlider} />
                </button>
              </div>
            </div>

            {/* Conta */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
                    <circle cx='12' cy='7' r='4' />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>Conta</h2>
                  <p className={styles.sectionDescription}>
                    Gerencie sua conta e privacidade
                  </p>
                </div>
              </div>

              <div className={styles.dangerZone}>
                <h3 className={styles.dangerTitle}>Zona de Perigo</h3>
                <p className={styles.dangerDescription}>
                  Ações irreversíveis relacionadas à sua conta
                </p>
                <button className={styles.dangerButton}>
                  <svg
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <polyline points='3 6 5 6 21 6' />
                    <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
                  </svg>
                  Excluir Conta
                </button>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
