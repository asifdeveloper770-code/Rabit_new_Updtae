import { useEffect, useRef, useState } from "react";
import vial from "@/assets/vial.jpg";

const CARDS = [
  {
    tag: "01 / Signal",
    title: "Targeted Peptide Signaling",
    body:
      "Amino-acid chains that speak directly to receptors — driving hypertrophy, recovery, and cellular repair with sniper precision.",
  },
  {
    tag: "02 / Recovery",
    title: "Accelerated Tissue Repair",
    body:
      "Collagen synthesis, mitochondrial density, and CNS recovery — bounce back from brutal sessions in a fraction of the time.",
  },
  {
    tag: "03 / Adapt",
    title: "Adaptive Metabolic Load",
    body:
      "Optimized nutrient partitioning. Fat becomes fuel, protein becomes muscle. Zero wasted calories, maximum output.",
  },
];

export function ScienceSection() {
  const wrapRef = useRef<HTMLElement>(null);
  const [t, setT] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 as section enters viewport bottom, 1 as it leaves the top
      const p = Math.max(0, Math.min(1, 1 - (r.top + r.height * 0.3) / (vh + r.height * 0.6)));
      setT(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const rotate = t * 180;

  return (
    <section
      id="science"
      ref={wrapRef}
      className="relative overflow-hidden py-24 md:py-32 bg-slate-50 font-sans text-slate-800 antialiased selection:bg-[rgb(43_90_143)]/10 selection:text-[rgb(43_90_143)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1000px 700px at 20% 40%, rgb(43 90 143 / 0.05), transparent 60%), radial-gradient(900px 600px at 85% 70%, rgb(93 138 111 / 0.05), transparent 60%)",
        }}
      />

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-16 px-6 md:grid-cols-2 md:gap-10 md:px-12">
        {/* Left: vial */}
        <div className="relative flex min-h-[60vh] items-center justify-center md:sticky md:top-24 md:min-h-[80vh]">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 blur-3xl opacity-60"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgb(43 90 143 / 0.15), transparent 60%), radial-gradient(circle at 40% 60%, rgb(93 138 111 / 0.12), transparent 65%)",
            }}
          />
          <img
            src={vial}
            alt="Peptide vial"
            loading="lazy"
            width={1024}
            height={1280}
            className="max-h-[70vh] w-auto object-contain drop-shadow-[0_20px_30px_rgba(15,23,42,0.12)]"
            style={{
              transform: `rotate(${rotate}deg) scale(${0.95 + t * 0.08})`,
              transition: "transform 0.4s cubic-bezier(.2,.7,.2,1)",
            }}
          />
        </div>

        {/* Right: content */}
        <div className="reveal flex flex-col gap-6">
          <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(93_138_111)]">
            / The Mechanism
          </span>
          <h2 className="font-sans font-extrabold text-4xl leading-tight text-slate-900 md:text-6xl">
            Science
            <br />
            <span className="text-[rgb(43_90_143)]">Engineered.</span>
          </h2>
          <p className="max-w-md font-sans text-sm leading-relaxed text-slate-600 md:text-base">
            Every compound is third-party lab-verified. Every batch is HPLC-tested.
            We don't sell hope — we sell measurable adaptation.
          </p>

          <div className="mt-4 flex flex-col gap-4">
            {CARDS.map((c) => (
              <div
                key={c.tag}
                data-magnetic
                className="reveal group relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-baseline justify-between font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>{c.tag}</span>
                  <span className="text-[rgb(93_138_111)]">Verified</span>
                </div>
                <h3 className="mt-3 font-sans font-extrabold text-2xl text-slate-900">{c.title}</h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-slate-600">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}