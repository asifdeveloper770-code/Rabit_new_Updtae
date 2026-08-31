import { ParticleField } from "./ParticleField";
import { MagneticButton } from "./MagneticButton";
import logo from "@/assets/jacked-rabbits-logo.png";

export function Hero() {
  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden pt-24 bg-slate-50 font-sans text-slate-800 antialiased selection:bg-[rgb(43_90_143)]/10 selection:text-[rgb(43_90_143)]">
      <div className="pointer-events-none absolute inset-0">
        <ParticleField />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(248,250,252,0.6)_60%,rgb(248,250,252)_100%)]" />
      </div>

      {/* Content */}
      <div
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-6 text-center"
        style={{
          paddingLeft: "max(env(safe-area-inset-left), 1.5rem)",
          paddingRight: "max(env(safe-area-inset-right), 1.5rem)",
        }}
      >
       
        <div className="jr-rabbit-stage relative w-full">
          {/* Colored aura */}
          <div
            aria-hidden
            className="jr-rabbit-aura absolute inset-0 -z-10 blur-3xl opacity-60"
          />

          <img
            src={logo}
            width={900}
            height={1200}
            alt="Jacked Rabbits — Build, Recover, Adapt"
            className="jr-rabbit mx-auto block h-auto w-[clamp(240px,58vw,500px)] max-w-full select-none drop-shadow-[0_20px_30px_rgba(15,23,42,0.08)]"
            draggable={false}
            decoding="async"
            fetchPriority="high"
          />
        </div>

        <div
          className="mt-8 flex w-full flex-col items-center gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:gap-4"
          style={{ animation: "jr-fade-up 1.2s 0.7s both" }}
        >
          <MagneticButton variant="blue" to="/shop?category=Peptides">
            Shop Peptides
          </MagneticButton>
          <MagneticButton variant="black" to="/shop?category=Injectables">
            Shop Injectables
          </MagneticButton>
          <MagneticButton variant="ghost" to="/shop?category=Oral">
            Shop Orals
          </MagneticButton>
          <MagneticButton variant="green" to="/shop">
            Shop All
          </MagneticButton>
        </div>

        {/* <div
          className="mt-16 grid w-full grid-cols-3 gap-4 border-t border-slate-200/80 pt-8 md:mt-20 md:gap-10"
          style={{ animation: "jr-fade-up 1.4s 1s both" }}
        >
          {[
            { k: "99.4%", v: "Avg Purity" },
            { k: "12k+", v: "Athletes" },
            { k: "24h", v: "Ship Time" },
          ].map((s) => (
            <div key={s.v} className="text-center">
              <div className="font-sans font-extrabold text-3xl text-slate-900 md:text-5xl">
                <span className="text-[rgb(43_90_143)]">{s.k}</span>
              </div>
              <div className="mt-1 font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {s.v}
              </div>
            </div>
          ))}
        </div> */}
      </div>

      {/* Scroll indicator */}
      {/* <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 font-sans text-[11px] font-bold uppercase tracking-widest text-slate-400">
        <div className="flex flex-col items-center gap-2">
          <span>Scroll</span>
          <span className="h-8 w-px bg-gradient-to-b from-slate-300 to-transparent" />
        </div>
      </div> */}
    </section>
  );
}