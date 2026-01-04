import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout';
import { Container } from '../../components/ui';
import styles from './GetStarted.module.css';

// Grid configuration (same as Hero)
const GRID_COLS = 20;
const GRID_ROWS = 12;
const ACTIVE_SQUARES = 6;

/**
 * GetStarted page - Page for analyzing GitHub repositories
 */
export function GetStarted() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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

  const validateGitHubUrl = (url: string): boolean => {
    const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return githubPattern.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!repoUrl.trim()) {
      setError('Please enter a repository link');
      return;
    }

    if (!validateGitHubUrl(repoUrl)) {
      setError('Please enter a valid GitHub link (e.g. https://github.com/user/repository)');
      return;
    }

    setIsLoading(true);

    try {
      // Simulating API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Navigate to analysis page with repo URL
      navigate(`/analysis?repo=${encodeURIComponent(repoUrl)}`);
      
    } catch {
      setError('Error analyzing the repository. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate grid squares
  const gridSquares = Array.from({ length: GRID_COLS * GRID_ROWS }, (_, index) => {
    const isActive = activeSquares.includes(index);
    return (
      <div
        key={index}
        className={`${styles.gridSquare} ${isActive ? styles.gridSquareActive : ''}`}
      />
    );
  });

  return (
    <div className={styles.page}>
      <Navbar />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <h2 className={styles.loadingTitle}>Analyzing Repository</h2>
            <p className={styles.loadingText}>
              We are scanning the code and generating the documentation...
            </p>
            <div className={styles.loadingSteps}>
              <div className={styles.loadingStep}>
                <span className={styles.stepIcon}>🔍</span>
                <span>Cloning repository...</span>
              </div>
              <div className={styles.loadingStep}>
                <span className={styles.stepIcon}>📂</span>
                <span>Analyzing structure...</span>
              </div>
              <div className={styles.loadingStep}>
                <span className={styles.stepIcon}>🤖</span>
                <span>Generating documentation with AI...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className={styles.hero} ref={sectionRef}>
        <div className={styles.gradientBg}></div>
        <div 
          className={styles.gridBackground}
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
          }}
        >
          {gridSquares}
        </div>
        
        <Container size="lg">
          <div className={styles.content}>
            <h1 className={styles.title}>
              Start <span className={styles.highlight} style={gradientStyle}>Documenting</span>
            </h1>
            <p className={styles.subtitle}>
              Paste your GitHub repository link and let AI turn your code into living documentation.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputWrapper}>
                <span className={styles.inputIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </span>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/user/repository"
                  className={styles.input}
                  disabled={isLoading}
                />
              </div>
              
              {error && <p className={styles.error}>{error}</p>}
              
              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={isLoading}
              >
                {isLoading ? 'Analyzing...' : 'Analyze Repository'}
              </button>
            </form>

            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>⚡</span>
                <span>Analysis in seconds</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🔒</span>
                <span>Secure code</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🎯</span>
                <span>Accurate documentation</span>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

export default GetStarted;
