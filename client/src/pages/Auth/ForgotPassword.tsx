import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout';
import { Container } from '../../components/ui';
import styles from './Auth.module.css';

// Grid configuration
const GRID_COLS = 20;
const GRID_ROWS = 12;
const ACTIVE_SQUARES = 6;

/**
 * ForgotPassword page - Password recovery
 */
export function ForgotPassword() {
  const sectionRef = useRef<HTMLElement>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeSquares, setActiveSquares] = useState<number[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  // Generate random active squares
  const generateActiveSquares = useCallback(() => {
    const totalSquares = GRID_COLS * GRID_ROWS;
    const newActive: number[] = [];
    while (newActive.length < ACTIVE_SQUARES) {
      const randomIndex = Math.floor(Math.random() * totalSquares);
      if (!newActive.includes(randomIndex)) {
        newActive.push(randomIndex);
      }
    }
    return newActive;
  }, []);

  useEffect(() => {
    setActiveSquares(generateActiveSquares());
    const interval = setInterval(() => {
      setActiveSquares(generateActiveSquares());
    }, 2000);
    return () => clearInterval(interval);
  }, [generateActiveSquares]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setMousePosition({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
      }
    };

    const section = sectionRef.current;
    if (section) {
      section.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (section) {
        section.removeEventListener('mousemove', handleMouseMove);
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
    backgroundSize: '200% 200%',
    backgroundPosition: `${mousePosition.x * 100}% ${mousePosition.y * 100}%`,
  };

  const validateEmail = (email: string): boolean => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Por favor, insira seu e-mail');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor, insira um e-mail válido');
      return;
    }

    setIsLoading(true);

    try {
      // Simulating API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Implement actual password reset logic
      console.log('Password reset request for:', email);
      
      setIsSuccess(true);
    } catch (err) {
      setError('Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // TODO: Implement actual resend logic
      console.log('Resending password reset to:', email);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />
      
      <section ref={sectionRef} className={styles.hero}>
        {/* Gradient Background */}
        <div className={styles.gradientBg} />
        
        {/* Animated Grid */}
        <div 
          className={styles.gridBackground}
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
          }}
        >
          {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, index) => (
            <div
              key={index}
              className={`${styles.gridSquare} ${activeSquares.includes(index) ? styles.gridSquareActive : ''}`}
            />
          ))}
        </div>

        <Container size="sm">
          <div className={styles.content}>
            <div className={styles.authCard}>
              {!isSuccess ? (
                <>
                  <div className={styles.cardHeader}>
                    <div className={styles.iconWrapper}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <h1 className={styles.title}>
                      Esqueceu sua <span className={styles.highlight} style={gradientStyle}>senha</span>?
                    </h1>
                    <p className={styles.subtitle}>
                      Não se preocupe! Digite seu e-mail e enviaremos um link para você redefinir sua senha.
                    </p>
                  </div>

                  <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                      <label htmlFor="email" className={styles.label}>E-mail</label>
                      <div className={styles.inputWrapper}>
                        <span className={styles.inputIcon}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                        </span>
                        <input
                          type="email"
                          id="email"
                          className={styles.input}
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button 
                      type="submit" 
                      className={styles.submitBtn}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className={styles.btnSpinner}></span>
                          Enviando...
                        </>
                      ) : (
                        'Enviar link de recuperação'
                      )}
                    </button>
                  </form>

                  <p className={styles.switchAuth}>
                    Lembrou sua senha?{' '}
                    <Link to="/login" className={styles.switchLink}>
                      Voltar ao login
                    </Link>
                  </p>
                </>
              ) : (
                <div className={styles.successState}>
                  <div className={styles.successIcon}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <h2 className={styles.successTitle}>E-mail enviado!</h2>
                  <p className={styles.successText}>
                    Enviamos um link de recuperação para <strong>{email}</strong>. 
                    Verifique sua caixa de entrada e siga as instruções.
                  </p>
                  <p className={styles.successNote}>
                    Não recebeu o e-mail? Verifique sua pasta de spam ou{' '}
                    <button 
                      type="button" 
                      className={styles.resendBtn}
                      onClick={handleResend}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Reenviando...' : 'clique aqui para reenviar'}
                    </button>
                  </p>
                  <Link to="/login" className={styles.backToLogin}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="19" y1="12" x2="5" y2="12"/>
                      <polyline points="12 19 5 12 12 5"/>
                    </svg>
                    Voltar ao login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

export default ForgotPassword;
