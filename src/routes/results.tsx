import { createFileRoute } from "@tanstack/react-router";
import { WallOfGains } from "@/components/jr/WallOfGains";
import { MagneticButton } from "@/components/jr/MagneticButton";
import { useReveal } from "@/lib/useReveal";
import { Star, Quote } from "lucide-react";
import g1 from "@/assets/gains1.jpg";
import g2 from "@/assets/gains2.jpg";
import g3 from "@/assets/gains3.jpg";
import g4 from "@/assets/gains4.jpg";
import g5 from "@/assets/gains5.jpg";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Results — Real Athletes, Real Data · Jacked Rabbits" },
      { name: "description", content: "12,000+ athletes. Verified transformations, strength PRs, and lab-tested outcomes on Jacked Rabbits protocols." },
      { property: "og:title", content: "The Wall of Gains — Jacked Rabbits" },
      { property: "og:description", content: "Real athletes. Real labs. Real numbers. Zero photoshop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultsPage,
});

const REVIEWS = [
  {
    name: "Marcus K.",
    role: "4× National Powerlifter",
    rating: 5,
    img: g1,
    stack: "BPC-157 + TB-500",
    weeks: 12,
    quote:
      "Added 18 lbs of lean tissue with zero bloat. My squat went from stalled at 705 to a competition 765 in three months. The recovery is what unlocked it — I'm training six days a week without joint pain.",
    stats: [
      { k: "+18 lb", v: "Lean mass" },
      { k: "+60 lb", v: "Squat PR" },
      { k: "-4.2%", v: "Body fat" },
    ],
  },
  {
    name: "Tanya R.",
    role: "CrossFit Regionals Athlete",
    rating: 5,
    img: g2,
    stack: "CJC-1295 + Ipamorelin",
    weeks: 8,
    quote:
      "Sleep hit different from week two. Deep sleep almost doubled on my Oura. Recovery scores were consistently in the high 80s. My Fran time dropped 22 seconds without changing anything else.",
    stats: [
      { k: "1:56", v: "Fran (was 2:18)" },
      { k: "+42%", v: "Deep sleep" },
      { k: "88", v: "Avg recovery" },
    ],
  },
  {
    name: "Jordan D.",
    role: "IFBB Pro Prep",
    rating: 5,
    img: g3,
    stack: "IGF-1 LR3 + MOTS-C",
    weeks: 16,
    quote:
      "Best contest prep of my career. Held every ounce of lean tissue while dropping to 4.8% BF. My conditioning judges called 'painted-on skin.' Insulin sensitivity was elite throughout.",
    stats: [
      { k: "4.8%", v: "Stage BF" },
      { k: "+9 lb", v: "Stage weight" },
      { k: "1st", v: "Class placing" },
    ],
  },
  {
    name: "Samir A.",
    role: "Strongman Competitor",
    rating: 5,
    img: g4,
    stack: "BPC-157 + TB-500 + GHK-Cu",
    weeks: 14,
    quote:
      "Torn rotator cuff last year — thought I was done. Six weeks in I was pressing pain-free. Now I've hit a 615 deadlift for the first time and my shoulder feels bulletproof under log press.",
    stats: [
      { k: "+55 lb", v: "Deadlift PR" },
      { k: "0/10", v: "Shoulder pain" },
      { k: "6 wk", v: "Return to lift" },
    ],
  },
  {
    name: "Elena V.",
    role: "Ultra-Endurance Coach",
    rating: 5,
    img: g5,
    stack: "MOTS-C + Epithalon",
    weeks: 10,
    quote:
      "VO2 max jumped from 54 to 61 in ten weeks at 42 years old. That's not supposed to happen. My last 100k, I negative-split the second half. Never done that before in fifteen years of racing.",
    stats: [
      { k: "+7", v: "VO2 max" },
      { k: "-8:12", v: "100k PB" },
      { k: "142", v: "Threshold HR" },
    ],
  },
  {
    name: "Devin M.",
    role: "Tactical Operator",
    rating: 5,
    img: g1,
    stack: "Semax + Selank",
    weeks: 6,
    quote:
      "Cognitive load under fatigue is my job. Since starting Semax stack I'm sharper at hour 20 than I was at hour 4. Reaction time on our drill benchmarks improved measurably.",
    stats: [
      { k: "-18%", v: "Reaction time" },
      { k: "+2 hr", v: "Focus window" },
      { k: "6/6", v: "Drill benchmark" },
    ],
  },
];

function ResultsPage() {
  useReveal();
  const avgRating = 4.9;
  return (
    <main className="relative min-h-screen pt-28 bg-slate-50 font-sans text-slate-800 antialiased selection:bg-[rgb(43_90_143)]/10 selection:text-[rgb(43_90_143)]">
      {/* Hero Band */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white py-16 md:py-24">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-15"
          style={{
            backgroundImage: `url(${g3})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "grayscale(1)",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/80 via-white/90 to-white" />
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(93_138_111)]">
            / Wall of Gains
          </span>
          <h1 className="mt-3 font-sans font-extrabold text-5xl tracking-tight text-slate-900 md:text-7xl leading-none">
            Receipts.<br />
            <span className="text-[rgb(43_90_143)]">Not promises.</span>
          </h1>
          <p className="mt-6 max-w-xl font-sans text-sm leading-relaxed text-slate-600 md:text-base">
            Twelve thousand athletes. Real bloodwork. Real bar loads. Real
            stopwatch splits. Every review is submitted with a batch number and
            verified against our order records.
          </p>

          <div className="mt-10 flex flex-wrap gap-8 border-t border-slate-200/80 pt-8">
            <Stat k={`${avgRating}/5`} v="Avg rating · 12k+ reviews" />
            <Stat k="94%" v="Would recommend" />
            <Stat k="99.4%" v="Lot purity avg" />
            <Stat k="18d" v="Avg time to visible result" />
          </div>
        </div>
      </section>

      <WallOfGains />

      {/* Full Reviews Section */}
      <section className="border-t border-slate-200/80 bg-slate-50 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="mb-16 flex flex-col gap-4">
            <span className="reveal font-sans text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
              / Verified Reviews
            </span>
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <h2 className="reveal max-w-3xl font-sans font-extrabold text-4xl tracking-tight text-slate-900 md:text-6xl leading-tight">
                In their <span className="text-[rgb(43_90_143)]">own words.</span>
              </h2>
              <div className="reveal flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-[rgb(93_138_111)] text-[rgb(93_138_111)]" />
                ))}
                <span className="ml-2 font-sans text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {avgRating} · 12,341 reviews
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {REVIEWS.map((r, i) => (
              <article
                key={r.name}
                data-magnetic
                className="reveal group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md md:p-8"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <Quote className="absolute right-6 top-6 h-16 w-16 text-slate-200/50" />
                <div className="flex items-center gap-4">
                  <img
                    src={r.img}
                    alt={r.name}
                    className="h-14 w-14 rounded-full border border-slate-200 object-cover shadow-sm"
                  />
                  <div>
                    <div className="font-sans font-bold text-xl text-slate-900">{r.name}</div>
                    <div className="font-sans text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      {r.role}
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-0.5">
                    {Array.from({ length: r.rating }).map((_, k) => (
                      <Star key={k} className="h-3.5 w-3.5 fill-[rgb(93_138_111)] text-[rgb(93_138_111)]" />
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Chip>{r.stack}</Chip>
                  <Chip>{r.weeks} wk protocol</Chip>
                  <Chip tone="green">Verified purchase</Chip>
                </div>

                <p className="mt-5 font-sans text-sm leading-relaxed text-slate-600 md:text-base">
                  "{r.quote}"
                </p>

                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
                  {r.stats.map((s) => (
                    <div key={s.v}>
                      <div className="font-sans font-black text-2xl text-[rgb(43_90_143)]">
                        {s.k}
                      </div>
                      <div className="mt-1 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {s.v}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Rating Breakdown Section */}
      <section className="border-t border-slate-200/80 bg-white py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-2 md:px-12">
          <div>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(93_138_111)]">
              / Distribution
            </span>
            <h2 className="mt-2 font-sans font-extrabold text-4xl tracking-tight text-slate-900 md:text-5xl">
              The bell curve.
            </h2>
            <p className="mt-4 max-w-md font-sans text-sm leading-relaxed text-slate-600">
              Aggregated across 12,341 verified reviews. Filtered by
              batch-linked purchases only.
            </p>
          </div>
          <div className="flex flex-col gap-3 justify-center">
            {[
              { s: 5, pct: 87 },
              { s: 4, pct: 9 },
              { s: 3, pct: 2.5 },
              { s: 2, pct: 1 },
              { s: 1, pct: 0.5 },
            ].map((r) => (
              <div key={r.s} className="flex items-center gap-4">
                <div className="flex w-16 items-center gap-1 font-sans text-xs font-semibold text-slate-600">
                  {r.s} <Star className="h-3.5 w-3.5 fill-slate-400 text-slate-400" />
                </div>
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${r.pct}%`,
                      background:
                        "linear-gradient(90deg, rgb(43 90 143), rgb(93 138 111))",
                    }}
                  />
                </div>
                <div className="w-12 text-right font-sans text-xs font-semibold text-slate-500">
                  {r.pct}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-slate-50 py-32 border-t border-slate-200/80">
        <div className="mx-auto max-w-4xl px-6 text-center md:px-12">
          <h2 className="font-sans font-extrabold text-5xl tracking-tight text-slate-900 md:text-7xl leading-none">
            Your <span className="text-[rgb(93_138_111)]">turn.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg font-sans text-sm text-slate-600 md:text-base">
            The wall keeps growing. Add your name to the receipts.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <MagneticButton to="/shop" variant="green">Start your protocol</MagneticButton>
            <MagneticButton to="/contact" variant="ghost">Ask a specialist</MagneticButton>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="font-sans font-black text-3xl text-slate-900 md:text-4xl">
        <span className="text-[rgb(43_90_143)]">{k}</span>
      </div>
      <div className="mt-1 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {v}
      </div>
    </div>
  );
}

function Chip({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "green" }) {
  const cls =
    tone === "green"
      ? "border-[rgb(93_138_111)]/30 bg-[rgb(93_138_111)]/10 text-[rgb(93_138_111)]"
      : "border-slate-200 bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
      {children}
    </span>
  );
}