import { useEffect, useRef } from 'react';

interface FireOverlayProps {
  active: boolean;
  onComplete: () => void;
}

export function FireOverlay({ active, onComplete }: FireOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const DURATION = 2200;
    startTimeRef.current = performance.now();

    const particles: Particle[] = [];
    for (let i = 0; i < 120; i++) {
      particles.push(createParticle(canvas.width, canvas.height));
    }

    function createParticle(w: number, h: number): Particle {
      return {
        x: Math.random() * w,
        y: h + Math.random() * 60,
        vx: (Math.random() - 0.5) * 3,
        vy: -(Math.random() * 8 + 4),
        size: Math.random() * 28 + 10,
        alpha: Math.random() * 0.8 + 0.2,
        hue: Math.random() * 40,
        life: Math.random(),
      };
    }

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      size: number; alpha: number;
      hue: number; life: number;
    }

    function draw(now: number) {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      const flashAlpha = progress < 0.08
        ? progress / 0.08
        : progress < 0.18
          ? 1 - (progress - 0.08) / 0.10
          : 0;

      if (flashAlpha > 0) {
        ctx!.fillStyle = `rgba(255, 120, 0, ${flashAlpha * 0.85})`;
        ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      }

      const fadeOut = progress > 0.65 ? 1 - (progress - 0.65) / 0.35 : 1;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.985;
        p.vx += (Math.random() - 0.5) * 0.4;
        p.life += 0.012;
        p.size *= 0.993;

        if (p.y < -p.size || p.size < 1) {
          const reset = createParticle(canvas!.width, canvas!.height);
          Object.assign(p, reset);
        }

        const lifeAlpha = Math.sin(Math.PI * Math.min(p.life, 1)) * p.alpha * fadeOut;
        if (lifeAlpha <= 0) continue;

        const gradient = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `hsla(${50 + p.hue}, 100%, 90%, ${lifeAlpha})`);
        gradient.addColorStop(0.3, `hsla(${30 + p.hue}, 100%, 60%, ${lifeAlpha * 0.9})`);
        gradient.addColorStop(0.7, `hsla(${10 + p.hue}, 100%, 40%, ${lifeAlpha * 0.6})`);
        gradient.addColorStop(1, `hsla(0, 100%, 20%, 0)`);

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = gradient;
        ctx!.fill();
      }

      const textAlpha = progress < 0.15
        ? progress / 0.15
        : progress > 0.7
          ? 1 - (progress - 0.7) / 0.3
          : 1;

      if (textAlpha > 0) {
        const cx = canvas!.width / 2;
        const cy = canvas!.height / 2;
        const scale = progress < 0.12 ? 0.6 + (progress / 0.12) * 0.4 : 1;

        ctx!.save();
        ctx!.translate(cx, cy);
        ctx!.scale(scale, scale);

        ctx!.shadowColor = 'rgba(255, 100, 0, 0.9)';
        ctx!.shadowBlur = 40;
        ctx!.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
        ctx!.font = `bold ${Math.min(canvas!.width * 0.13, 90)}px Inter, sans-serif`;
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'middle';
        ctx!.fillText("YOU'RE ON FIRE!", 0, 0);

        ctx!.shadowBlur = 0;
        ctx!.font = `${Math.min(canvas!.width * 0.06, 42)}px Inter, sans-serif`;
        ctx!.fillStyle = `rgba(255, 200, 80, ${textAlpha})`;
        ctx!.fillText('🔥 New Best Streak! 🔥', 0, Math.min(canvas!.width * 0.10, 72));

        ctx!.restore();
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(draw);
      } else {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
        onComplete();
      }
    }

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
