import { Container } from '../../ui';
import styles from './Hero.module.css';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

// Grid configuration
const GRID_COLS = 20;
const GRID_ROWS = 12;
const ACTIVE_SQUARES = 6; // Number of highlighted squares at a time

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [activeSquares, setActiveSquares] = useState<number[]>([]);

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
    // Initialize active squares
    setActiveSquares(generateActiveSquares());

    // Update active squares periodically
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
            Código <span className={styles.highlight} style={gradientStyle}>Vivo</span>,
            <br />
            Documentação <span className={styles.highlight} style={gradientStyle}>Falada</span>
          </h1>
          <p className={styles.subtitle}>
            Transforme seu código técnico em documentação interativa que fala por si. 
            Chega de sofrer para entender projetos legados.
          </p>
          <div className={styles.actions}>
            <Link to="/comecar" className={styles.primaryBtn}>Começar Agora</Link>
            <button className={styles.secondaryBtn}>Ver Demo</button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Hero;
