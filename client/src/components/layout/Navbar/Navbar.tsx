import styles from "./Navbar.module.css";
import { Container } from "../../ui";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../../hooks";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate("/");
  };

  // Gera iniciais do nome para o avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Cores aleatórias para o avatar baseado no nome
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

  return (
    <header
      className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""}`}
    >
      <Container size='xl'>
        <nav className={styles.nav}>
          <Link to='/' className={styles.logo}>
            <img src='/logo.svg' alt='Logo' className={styles.logoIcon} />
            <img
              src='/logo-text-black.svg'
              alt='Logo-Text'
              className={styles.logoText}
            />
          </Link>

          <div className={styles.links}></div>

          <div className={styles.actions}>
            <a
              href='https://github.com/Hacktown-BSB/Nexo'
              target='_blank'
              rel='noopener noreferrer'
              className={styles.link}
            >
              Contato
            </a>

            {isAuthenticated && user ? (
              // Usuário autenticado - mostra avatar e dropdown
              <div className={styles.userMenu}>
                <button
                  className={styles.avatarButton}
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-label='Menu do usuário'
                >
                  <div
                    className={styles.avatar}
                    style={{ backgroundColor: getAvatarColor(user.name) }}
                  >
                    {getInitials(user.name)}
                  </div>
                  <span className={styles.userName}>{user.name}</span>
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    className={styles.dropdownIcon}
                  >
                    <polyline points='6 9 12 15 18 9' />
                  </svg>
                </button>

                {showDropdown && (
                  <>
                    <div
                      className={styles.dropdownOverlay}
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>
                        <div
                          className={styles.dropdownAvatar}
                          style={{ backgroundColor: getAvatarColor(user.name) }}
                        >
                          {getInitials(user.name)}
                        </div>
                        <div className={styles.dropdownUserInfo}>
                          <p className={styles.dropdownUserName}>{user.name}</p>
                          <p className={styles.dropdownUserEmail}>
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className={styles.dropdownDivider} />

                      <Link
                        to='/perfil'
                        className={styles.dropdownItem}
                        onClick={() => setShowDropdown(false)}
                      >
                        <svg
                          width='18'
                          height='18'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                        >
                          <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
                          <circle cx='12' cy='7' r='4' />
                        </svg>
                        Meu Perfil
                      </Link>

                      <Link
                        to='/configuracoes'
                        className={styles.dropdownItem}
                        onClick={() => setShowDropdown(false)}
                      >
                        <svg
                          width='18'
                          height='18'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                        >
                          <circle cx='12' cy='12' r='3' />
                          <path d='M12 1v6m0 6v6m6-12l-6 6m0 0l-6 6m12 0l-6-6m0 0l-6-6' />
                        </svg>
                        Configurações
                      </Link>

                      <div className={styles.dropdownDivider} />

                      <button
                        className={styles.dropdownItem}
                        onClick={handleLogout}
                      >
                        <svg
                          width='18'
                          height='18'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                        >
                          <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
                          <polyline points='16 17 21 12 16 7' />
                          <line x1='21' y1='12' x2='9' y2='12' />
                        </svg>
                        Sair
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Usuário não autenticado - mostra botões de login/registro
              <>
                <Link to='/login' className={styles.link}>
                  Entrar
                </Link>
                <Link to='/register' className={styles.tryButton}>
                  Criar Conta
                </Link>
              </>
            )}

            <a
              href='https://github.com/Hacktown-BSB/Nexo'
              target='_blank'
              rel='noopener noreferrer'
              className={styles.githubLink}
              aria-label='GitHub'
            >
              <svg
                width='22'
                height='22'
                viewBox='0 0 24 24'
                fill='currentColor'
              >
                <path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
              </svg>
            </a>
          </div>
        </nav>
      </Container>
    </header>
  );
}

export default Navbar;
