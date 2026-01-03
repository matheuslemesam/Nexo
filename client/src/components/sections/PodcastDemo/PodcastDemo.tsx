import { useRef, useState, useEffect } from "react";
import { Container } from "../../ui";
import styles from "./PodcastDemo.module.css";

/**
 * PodcastDemo section - Demonstrates AI-generated podcast feature
 */
export function PodcastDemo() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
    };
  }, []);

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

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSpeedChange = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <section className={styles.podcastDemo} id='podcast-demo'>
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

              {/* Progress Bar */}
              <div className={styles.progressContainer}>
                <span className={styles.timeLabel}>
                  {formatTime(currentTime)}
                </span>
                <div className={styles.progressBar} onClick={handleSeek}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                  <div
                    className={styles.progressThumb}
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
                <span className={styles.timeLabel}>{formatTime(duration)}</span>
              </div>

              {/* Controls */}
              <div className={styles.controls}>
                <button
                  className={styles.controlButton}
                  onClick={handleReset}
                  aria-label='Reset'
                  title='Reset to start'
                >
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <path d='M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' />
                    <path d='M3 3v5h5' />
                  </svg>
                </button>

                <button
                  className={styles.playButton}
                  onClick={handlePlayPause}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <svg
                      width='32'
                      height='32'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                    >
                      <rect x='6' y='4' width='4' height='16' rx='1' />
                      <rect x='14' y='4' width='4' height='16' rx='1' />
                    </svg>
                  ) : (
                    <svg
                      width='32'
                      height='32'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                    >
                      <path d='M8 5v14l11-7z' />
                    </svg>
                  )}
                </button>

                <button
                  className={styles.speedButton}
                  onClick={handleSpeedChange}
                  aria-label='Playback speed'
                  title={`Speed: ${playbackRate}x`}
                >
                  {playbackRate}x
                </button>
              </div>

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
