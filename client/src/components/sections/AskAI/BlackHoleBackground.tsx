import styles from "./BlackHoleBackground.module.css";

export function BlackHoleBackground() {
  return (
    <div className={styles.gifContainer}>
      <img
        src="/black-hole-bg.gif"
        alt=""
        className={styles.gifBackground}
      />
    </div>
  );
}
