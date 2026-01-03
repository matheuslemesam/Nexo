import { useRef, useEffect } from "react";
import styles from "./BlackHoleBackground.module.css";

export function BlackHoleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    let time = 0;

    const animate = () => {
      time += 0.005;

      const centerX = canvas.offsetWidth / 2;
      const centerY = canvas.offsetHeight / 2;

      // Deep space gradient background
      const bgGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(canvas.offsetWidth, canvas.offsetHeight)
      );
      bgGradient.addColorStop(0, "#0a0520");
      bgGradient.addColorStop(0.5, "#050212");
      bgGradient.addColorStop(1, "#000000");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Animated nebula clouds
      for (let i = 0; i < 3; i++) {
        const offsetX = Math.sin(time * 0.3 + i * 2) * 100;
        const offsetY = Math.cos(time * 0.2 + i * 3) * 80;
        const nebula = ctx.createRadialGradient(
          centerX + offsetX,
          centerY + offsetY,
          0,
          centerX + offsetX,
          centerY + offsetY,
          300 + Math.sin(time + i) * 50
        );
        nebula.addColorStop(0, `hsla(${240 + i * 20}, 80%, 50%, 0.08)`);
        nebula.addColorStop(0.5, `hsla(${260 + i * 15}, 70%, 45%, 0.04)`);
        nebula.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      }

      // Twinkling stars
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      for (let i = 0; i < 150; i++) {
        const starX = (i * 137.5) % canvas.offsetWidth;
        const starY = (i * 219.3) % canvas.offsetHeight;
        const brightness = Math.abs(Math.sin(time * 2 + i * 0.1));
        ctx.globalAlpha = brightness * 0.8;
        ctx.fillRect(starX, starY, 2, 2);
      }
      ctx.globalAlpha = 1;

      // Black hole center
      const blackHoleRadius = 100;

      // Outer glow ring (gravitational lensing)
      const lensingGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        blackHoleRadius * 2,
        centerX,
        centerY,
        blackHoleRadius * 4
      );
      lensingGradient.addColorStop(0, "rgba(100, 150, 255, 0.3)");
      lensingGradient.addColorStop(0.5, "rgba(138, 43, 226, 0.2)");
      lensingGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = lensingGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, blackHoleRadius * 4, 0, Math.PI * 2);
      ctx.fill();

      // Rotating accretion disk
      for (let layer = 0; layer < 4; layer++) {
        const radius = blackHoleRadius * (1.5 + layer * 0.4);
        const particles = 60;

        for (let i = 0; i < particles; i++) {
          const angle =
            (i / particles) * Math.PI * 2 + time * (1.5 + layer * 0.3);
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius * 0.3;

          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          const intensity = 1 - dist / (radius * 1.2);

          ctx.fillStyle = `hsla(${230 + layer * 20}, 100%, 65%, ${
            intensity * 0.4
          })`;
          ctx.beginPath();
          ctx.arc(x, y, 2 + layer * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Accretion disk glow
      const diskGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        blackHoleRadius * 0.8,
        centerX,
        centerY,
        blackHoleRadius * 2.5
      );
      diskGlow.addColorStop(0, "rgba(180, 100, 255, 0.3)");
      diskGlow.addColorStop(0.5, "rgba(138, 43, 226, 0.2)");
      diskGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = diskGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, blackHoleRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Event horizon
      const horizonGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        blackHoleRadius
      );
      horizonGradient.addColorStop(0, "#000000");
      horizonGradient.addColorStop(0.8, "#0a0015");
      horizonGradient.addColorStop(1, "rgba(30, 0, 60, 0.8)");
      ctx.fillStyle = horizonGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, blackHoleRadius, 0, Math.PI * 2);
      ctx.fill();

      // Singularity
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(centerX, centerY, blackHoleRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      requestAnimationFrame(animate);
    };

    animate();

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}
