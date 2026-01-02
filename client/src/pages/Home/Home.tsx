import { useState } from 'react';
import { Button } from '../../components';
import styles from './Home.module.css';
import viteLogo from '/vite.svg';
import reactLogo from '../../assets/react.svg';

/**
 * Página inicial da aplicação
 */
export function Home() {
  const [count, setCount] = useState(0);

  return (
    <div className={styles.container}>
      <div className={styles.logos}>
        <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
          <img src={viteLogo} className={styles.logo} alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
          <img src={reactLogo} className={`${styles.logo} ${styles.react}`} alt="React logo" />
        </a>
      </div>

      <h1>Nexo - React + TypeScript</h1>

      <div className={styles.card}>
        <Button onClick={() => setCount((prev) => prev + 1)} size="lg">
          Contador: {count}
        </Button>
        <p className={styles.hint}>
          Edite <code>src/pages/Home/Home.tsx</code> e salve para testar HMR
        </p>
      </div>

      <p className={styles.readTheDocs}>
        Clique nos logos do Vite e React para saber mais
      </p>
    </div>
  );
}

export default Home;
