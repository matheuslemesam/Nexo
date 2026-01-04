import { Container } from "../../ui";
import styles from "./Footer.module.css";
import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function Footer() {
  const highlightRef = useRef<HTMLSpanElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (highlightRef.current) {
        const rect = highlightRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePosition({
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y)),
        });
      }
    };

    const highlight = highlightRef.current;
    if (highlight) {
      highlight.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (highlight) {
        highlight.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  const gradientStyle = {
    backgroundImage: `linear-gradient(
      ${mousePosition.x * 360}deg,
      #667eea ${mousePosition.y * 20}%,
      #764ba2 ${30 + mousePosition.x * 20}%,
      #f093fb ${60 + mousePosition.y * 20}%,
      #667eea 100%
    )`,
    backgroundSize: "200% 200%",
    backgroundPosition: `${mousePosition.x * 100}% ${mousePosition.y * 100}%`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  return (
    <footer className={styles.footer}>
      <Container size='xl'>
        <div className={styles.cta}>
          <div className={styles.logo}>
            <img src="/logo.svg" alt="Nexo Logo" className={styles.logoImage} />
          </div>
          <h2 className={styles.ctaTitle}>
            Transform repositories into
            <br />
            <span 
              ref={highlightRef}
              className={styles.highlight}
              style={gradientStyle}
            >
              actionable insights
            </span>
          </h2>
          <div className={styles.ctaButtons}>
            <Link to="/comecar" className={styles.primaryBtn}>Start Analyzing</Link>
            <Link to="/auth/register" className={styles.secondaryBtn}>Create Account</Link>
          </div>
        </div>

        <div className={styles.links}>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Product</h3>
            <ul>
              <li>
                <Link to="/comecar">Analyze Repository</Link>
              </li>
              <li>
                <Link to="/perfil">My Profile</Link>
              </li>
              <li>
                <Link to="/configuracoes">Settings</Link>
              </li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Account</h3>
            <ul>
              <li>
                <Link to="/auth/login">Sign In</Link>
              </li>
              <li>
                <Link to="/auth/register">Create Account</Link>
              </li>
              <li>
                <Link to="/auth/forgot-password">Forgot Password</Link>
              </li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>About</h3>
            <ul>
              <li>
                <a href="https://github.com/Hacktown-BSB/Nexo" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
              </li>
              <li>
                <a href="https://github.com/Hacktown-BSB/Nexo/issues" target="_blank" rel="noopener noreferrer">Report Issues</a>
              </li>
              <li>
                <a href="https://github.com/Hacktown-BSB/Nexo/blob/main/README.md" target="_blank" rel="noopener noreferrer">Documentation</a>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Nexo - Hacktown BSB. Open Source Project.
          </p>
          <div className={styles.legal}>
            <a href="https://github.com/Hacktown-BSB/Nexo/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>
            <a href="https://github.com/Hacktown-BSB" target="_blank" rel="noopener noreferrer">Hacktown BSB</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
