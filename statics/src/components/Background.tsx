import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

type Drop = { x: number; y: number; len: number; speed: number; opacity: number };
type Particle = { x: number; y: number; vx: number; vy: number; radius: number };

export default function Background({ count = 60 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { bgEffect, theme, mode } = useTheme();

  useEffect(() => {
    if (bgEffect === "none" || bgEffect === "gradient") return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const getAccentColor = () => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || (theme === "amber" ? "#f59e0b" : theme === "blue" ? "#3b82f6" : theme === "purple" ? "#a855f7" : "#22c55e");
    };

    if (bgEffect === "matrix") {
      let drops: Drop[] = [];
      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drops = Array.from({ length: count }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          len: 8 + Math.random() * 14,
          speed: 1.2 + Math.random() * 2.4,
          opacity: 0.08 + Math.random() * 0.18,
        }));
      };

      const tick = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const accent = getAccentColor();
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.strokeStyle = accent;
        for (const d of drops) {
          ctx.globalAlpha = d.opacity;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x, d.y + d.len);
          ctx.stroke();
          d.y += d.speed;
          if (d.y > h) {
            d.y = -d.len;
            d.x = Math.random() * w;
          }
        }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(tick);
      };

      resize();
      tick();
      window.addEventListener("resize", resize);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
      };
    } else if (bgEffect === "particles") {
      let particles: Particle[] = [];
      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        particles = Array.from({ length: Math.floor(w * h / 20000) }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 1.5 + 0.5
        }));
      };

      const tick = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const accent = getAccentColor();
        
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = accent;
        ctx.strokeStyle = accent;
        
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          
          ctx.globalAlpha = mode === 'dark' ? 0.4 : 0.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 100) {
              ctx.globalAlpha = (1 - dist / 100) * (mode === 'dark' ? 0.2 : 0.1);
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(tick);
      };

      resize();
      tick();
      window.addEventListener("resize", resize);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
      };
    }
  }, [count, bgEffect, theme, mode]);

  return (
    <>
      <div className="ambient-glow" aria-hidden="true" />
      {bgEffect === "gradient" && (
        <div 
          className="absolute inset-0 z-0 opacity-30 mix-blend-screen pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, var(--accent), transparent 60%)`,
            filter: "blur(80px)",
            animation: "pulse-glow 8s ease-in-out infinite alternate"
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ 
          position: "fixed", 
          inset: 0, 
          pointerEvents: "none", 
          zIndex: 0,
          opacity: bgEffect === "none" || bgEffect === "gradient" ? 0 : 1,
          transition: "opacity 0.5s ease"
        }}
      />
    </>
  );
}
