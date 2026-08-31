import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Strictly target desktop devices (precise cursor + hover capability + desktop screen width)
    const isDesktop = window.matchMedia(
      "(pointer: fine) and (hover: hover) and (min-width: 1024px)"
    ).matches;

    if (!isDesktop) return;

    document.documentElement.classList.add("jr-cursor-on");

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let tx = mx;
    let ty = my;
    let hovered: HTMLElement | null = null;
    let scale = 1;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (hovered) {
        const r = hovered.getBoundingClientRect();
        tx = r.left + r.width / 2;
        ty = r.top + r.height / 2;
      } else {
        tx = mx;
        ty = my;
      }
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>(
        "[data-magnetic], a, button"
      );
      hovered = el || null;
      scale = hovered ? 2.2 : 1;

      if (ringRef.current) {
        if (hovered) {
          ringRef.current.classList.add(
            "border-[rgb(93_138_111)]/60",
            "bg-[rgb(93_138_111)]/5"
          );
          ringRef.current.classList.remove("border-[rgb(43_90_143)]/40");
        } else {
          ringRef.current.classList.remove(
            "border-[rgb(93_138_111)]/60",
            "bg-[rgb(93_138_111)]/5"
          );
          ringRef.current.classList.add("border-[rgb(43_90_143)]/40");
        }
      }
    };

    const tick = () => {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mx - 3}px, ${my - 3}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0) scale(${scale})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.classList.remove("jr-cursor-on");
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden lg:block h-9 w-9 rounded-full border border-[rgb(43_90_143)]/40 transition-[width,height,border-color,background-color] duration-300"
        style={{ boxShadow: "none" }}
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] hidden lg:block h-1.5 w-1.5 rounded-full bg-slate-900"
      />
    </>
  );
}