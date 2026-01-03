import { useRef, useState } from "react";
import { Container } from "../../ui";
import styles from "./PodcastDemo.module.css";

/**
 * PodcastDemo section - Demonstrates AI-generated podcast feature
 */
export function PodcastDemo() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <section className={styles.podcastDemo}>
      <Container size='lg'>
        <div className={styles.content}>
          <div className={styles.textContent}>
            <span className={styles.badge}>🎧 New Feature</span>
            <h2 className={styles.title}>AI-Generated Explanatory Podcasts</h2>
            <p className={styles.description}>
              Transform any repository into an AI-narrated podcast. Listen to a
              complete explanation about architecture, technologies and features
              of the project while you work.
            </p>
            <ul className={styles.features}>
              <li className={styles.feature}>
                <span className={styles.featureIcon}>✨</span>
                <span>Professional narration with ElevenLabs</span>
              </li>
              <li className={styles.feature}>
                <span className={styles.featureIcon}>🚀</span>
                <span>Automatic repository analysis</span>
              </li>
              <li className={styles.feature}>
                <span className={styles.featureIcon}>📥</span>
                <span>MP3 download for offline listening</span>
              </li>
            </ul>
          </div>

          <div className={styles.playerCard}>
            <div className={styles.playerHeader}>
              <div className={styles.waveform}>
                <span className={styles.wave}></span>
                <span className={styles.wave}></span>
                <span className={styles.wave}></span>
                <span className={styles.wave}></span>
                <span className={styles.wave}></span>
              </div>
              <span className={styles.demoLabel}>Demo</span>
            </div>

            <div className={styles.playerContent}>
              <h3 className={styles.playerTitle}>Nexo Repository Analyzer</h3>
              <p className={styles.playerSubtitle}>
                AI-generated podcast example
              </p>

              <button
                className={styles.playButton}
                onClick={handlePlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                  >
                    <rect x='6' y='4' width='4' height='16' />
                    <rect x='14' y='4' width='4' height='16' />
                  </svg>
                ) : (
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                  >
                    <path d='M8 5v14l11-7z' />
                  </svg>
                )}
                <span>{isPlaying ? "Pause Podcast" : "Listen to Demo"}</span>
              </button>

              <audio
                ref={audioRef}
                src='/test_general.mp3'
                onEnded={handleAudioEnded}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
              />
            </div>

            <div className={styles.playerFooter}>
              <span className={styles.footerText}>
                🎧 Available for any public repository
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default PodcastDemo;
