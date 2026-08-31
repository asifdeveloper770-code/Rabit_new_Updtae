import { createFileRoute } from "@tanstack/react-router";
import { ScienceSection } from "@/components/jr/ScienceSection";
import { MagneticButton } from "@/components/jr/MagneticButton";
import { useReveal } from "@/lib/useReveal";
import { FlaskConical, FileCheck2, Microscope, ShieldCheck } from "lucide-react";
import vial from "@/assets/vial.jpg";

export const Route = createFileRoute("/science")({
  head: () => ({
    meta: [
      { title: "Science — HPLC-verified Peptides · Jacked Rabbits" },
      { name: "description", content: "The mechanism, the methodology, and the lab data behind every Jacked Rabbits compound." },
      { property: "og:title", content: "The Science — Jacked Rabbits" },
      { property: "og:description", content: "Peptide signaling, HPLC verification, and third-party lab reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SciencePage,
});

function SciencePage() {
  useReveal();
  return (
    <main className="relative min-h-screen pt-28 bg-slate-50 font-sans text-slate-800 antialiased selection:bg-[rgb(43_90_143)]/10 selection:text-[rgb(43_90_143)]">
      {/* Hero / Header Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white py-16 md:py-24">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(900px 500px at 30% 30%, rgb(43 90 143 / 0.08), transparent 60%), radial-gradient(900px 500px at 70% 70%, rgb(93 138 111 / 0.08), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
            / The Science
          </span>
          <h1 className="mt-3 font-sans font-extrabold text-5xl tracking-tight text-slate-900 md:text-7xl leading-none">
            Engineered.<br />
            <span className="text-[rgb(43_90_143)]">Audited.</span>
          </h1>
          <p className="mt-6 max-w-xl font-sans text-sm leading-relaxed text-slate-600 md:text-base">
            Every compound in the arsenal is analyzed by an ISO-17025 accredited
            laboratory. No pass, no ship. We publish the numbers.
          </p>
        </div>
      </section>

      {/* Embedded Component */}
      <ScienceSection />

      {/* 4-Column Methodology Feature Grid */}
      <section className="border-t border-slate-200/80 bg-slate-50 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { i: FlaskConical, t: "Synthesis", d: "Solid-phase peptide synthesis in ISO-9001 facilities." },
              { i: Microscope, t: "Analysis", d: "HPLC + mass spec on every 500-unit production lot." },
              { i: FileCheck2, t: "Documentation", d: "Batch-specific COA published on the product page." },
              { i: ShieldCheck, t: "Verification", d: "Blind spot-checks by an unaffiliated ISO-17025 lab." },
            ].map((c) => (
              <div
                key={c.t}
                className="reveal rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(93_138_111)]/10 text-[rgb(93_138_111)]">
                  <c.i className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-sans font-bold text-xl text-slate-900">{c.t}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lab Reports / COA Callout */}
      <section className="relative overflow-hidden bg-white py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-center md:px-12">
          <div className="reveal relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-[rgb(43_90_143)]/10 to-[rgb(93_138_111)]/10 blur-xl" />
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-2 shadow-md">
              <img
                src={vial}
                alt="Research Peptide Vial"
                className="w-full rounded-xl object-cover"
              />
            </div>
          </div>
          <div className="reveal flex flex-col gap-6">
            <div>
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
                / Reference The Data
              </span>
              <h2 className="mt-2 font-sans font-extrabold text-4xl tracking-tight text-slate-900 md:text-5xl leading-tight">
                Read the <span className="text-[rgb(43_90_143)]">lab reports.</span>
              </h2>
            </div>
            <p className="max-w-md font-sans text-sm leading-relaxed text-slate-600 md:text-base">
              Every product page links its lot-specific COA. Every COA is signed
              by the analyst who ran it. Every batch archived for eight years.
            </p>
            <div className="pt-2">
              <MagneticButton to="/shop" variant="blue">
                Browse compounds
              </MagneticButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}