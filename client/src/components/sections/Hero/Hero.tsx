import { Container } from "../../ui";
import styles from "./Hero.module.css";
import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { BlackHoleBackground } from "../AskAI/BlackHoleBackground";

// Grid configuration
const GRID_COLS = 20;
const GRID_ROWS = 12;
const ACTIVE_SQUARES = 6; // Number of highlighted squares at a time

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [activeSquares, setActiveSquares] = useState<number[]>([]);

  const handleWatchDemo = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const podcastSection = document.getElementById("podcast-demo");
    if (podcastSection) {
      podcastSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

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
        setMousePosition({
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y)),
        });
      }
    };

    const section = sectionRef.current;
    if (section) {
      section.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (section) {
        section.removeEventListener("mousemove", handleMouseMove);
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
  };

  // Generate grid squares
  const gridSquares = Array.from(
    { length: GRID_COLS * GRID_ROWS },
    (_, index) => {
      const isActive = activeSquares.includes(index);
      return (
        <div
          key={index}
          className={`${styles.gridSquare} ${
            isActive ? styles.gridSquareActive : ""
          }`}
        />
      );
    }
  );

  return (
    <section className={styles.hero} ref={sectionRef}>
      <BlackHoleBackground />
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
      <Container size='lg'>
        <div className={styles.content}>
          <h1 className={styles.title}>
            <span className={styles.highlight} style={gradientStyle}>
              Living
            </span>{" "}
            Code,
            <br />
            <span className={styles.highlight} style={gradientStyle}>
              Spoken
            </span>{" "}
            Documentation
          </h1>
          <p className={styles.subtitle}>
            Transform your technical code into interactive documentation that
            speaks for itself. Stop struggling to understand legacy projects.
          </p>
          <div className={styles.actions}>
            <Link to='/comecar' className={styles.primaryBtn}>
              Get Started
            </Link>
            <a
              href='#podcast-demo'
              className={styles.secondaryBtn}
              onClick={handleWatchDemo}
            >
              Watch Demo
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Hero;
