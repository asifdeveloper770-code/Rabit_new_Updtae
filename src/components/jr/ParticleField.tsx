import { useEffect, useRef } from "react";

/**
 * Lightweight peptide-chain particle background.
 * Uses 2D canvas with GPU-friendly draw calls. Reacts to mouse position.
 * Formatted for clean, light-themed background integration.
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = Math.min(55, Math.floor((window.innerWidth * window.innerHeight) / 38000));
    type P = { x: number; y: number; vx: number; vy: number; r: number; c: 0 | 1 };
    const parts: P[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: 1 + Math.random() * 1.8,
      c: Math.random() > 0.5 ? 0 : 1,
    }));

    const mouse = { x: -9999, y: -9999 };
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Move
      for (const p of parts) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 22500) {
          const f = (22500 - d2) / 22500;
          p.vx -= (dx / Math.sqrt(d2 + 1)) * f * 0.06;
          p.vy -= (dy / Math.sqrt(d2 + 1)) * f * 0.06;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985;
        p.vy *= 0.985;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
      }

      // Lines (peptide chains)
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 16000) {
            const alpha = (1 - d2 / 16000) * 0.22;
            const same = a.c === b.c;
            ctx.strokeStyle = same
              ? a.c === 0
                ? `rgba(43,90,143,${alpha})`
                : `rgba(93,138,111,${alpha})`
              : `rgba(148,163,184,${alpha * 0.7})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Points & Node Auras
      for (const p of parts) {
        const color = p.c === 0 ? "43,90,143" : "93,138,111";
        
        // Soft outer aura gradient for light backgrounds
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        grad.addColorStop(0, `rgba(${color},0.35)`);
        grad.addColorStop(0.4, `rgba(${color},0.12)`);
        grad.addColorStop(1, `rgba(${color},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fill();

        // Crisp central core node
        ctx.fillStyle = `rgba(${color},0.75)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden
    />
  );
}