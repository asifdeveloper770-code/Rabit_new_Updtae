import { useEffect, useRef } from "react";
import g1 from "@/assets/gains1.jpg";
import g2 from "@/assets/gains2.jpg";
import g3 from "@/assets/gains3.jpg";
import g4 from "@/assets/gains4.jpg";
import g5 from "@/assets/gains5.jpg";

const TILES: {
  img: string;
  quote: string;
  who: string;
  span: string;
  speed: number;
  h: number;
  w: number;
}[] = [
  { img: g1, quote: "+18 lbs lean in 12 weeks. No bloat.", who: "M.K. · Powerlifter", span: "md:col-span-2 md:row-span-2", speed: 0.06, h: 1000, w: 800 },
  { img: g2, quote: "Sleep hit different. Recovery is unreal.", who: "T.R. · CrossFit", span: "", speed: 0.03, h: 800, w: 800 },
  { img: g3, quote: "Down 6% BF while adding 9 lbs.", who: "J.D. · Bodybuilding", span: "md:row-span-2", speed: 0.09, h: 1100, w: 800 },
  { img: g4, quote: "Every batch. HPLC verified. 99.4%.", who: "Lab Report · Q3", span: "", speed: 0.05, h: 900, w: 800 },
  { img: g5, quote: "Deadlift PR up 55 lbs. Joints finally quiet.", who: "S.A. · Strongman", span: "md:col-span-2", speed: 0.04, h: 1000, w: 800 },
];

export function WallOfGains() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const imgs = el.querySelectorAll<HTMLElement>("[data-parallax]");
    let raf = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const start = el.offsetTop - window.innerHeight;
      const p = y - start;
      imgs.forEach((im) => {
        const s = parseFloat(im.dataset.parallax || "0");
        im.style.transform = `translate3d(0, ${p * s * -0.2}px, 0) scale(1.08)`;
      });
      raf = 0;
    };
    const handler = () => {
      if (!raf) raf = requestAnimationFrame(onScroll);
    };
    window.addEventListener("scroll", handler, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <section id="gains" ref={rootRef} className="relative py-32 bg-slate-50 font-sans text-slate-800 antialiased selection:bg-[rgb(43_90_143)]/10 selection:text-[rgb(43_90_143)]">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-16 flex flex-col gap-4">
          <span className="reveal font-sans text-xs font-bold uppercase tracking-widest text-[rgb(93_138_111)]">
            / Wall of Gains
          </span>
          <div className="flex items-end justify-between gap-6">
            <h2 className="reveal font-sans font-extrabold text-4xl leading-tight text-slate-900 md:text-6xl">
              Receipts.
              <br />
              <span className="text-[rgb(43_90_143)]">Not promises.</span>
            </h2>
            <p className="reveal hidden max-w-xs font-sans text-sm leading-relaxed text-slate-600 md:block">
              Real athletes. Real labs. Real numbers. Zero photoshop.
            </p>
          </div>
        </div>

        <div className="grid auto-rows-[240px] grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {TILES.map((t, i) => (
            <figure
              key={i}
              data-magnetic
              className={`reveal group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md ${t.span}`}
            >
              <img
                src={t.img}
                alt={t.who}
                loading="lazy"
                width={t.w}
                height={t.h}
                data-parallax={t.speed}
                className="absolute inset-0 h-[112%] w-full object-cover grayscale transition-[filter,transform] duration-700 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent opacity-85 transition-opacity duration-500 group-hover:opacity-75" />
              <figcaption className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-sans font-extrabold text-lg leading-snug text-white md:text-2xl">
                  "{t.quote}"
                </p>
                <div className="mt-2 font-sans text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t.who}
                </div>
              </figcaption>
              <span
                className="pointer-events-none absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[rgb(93_138_111)]"
                style={{ boxShadow: "0 0 12px rgb(93 138 111)" }}
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}