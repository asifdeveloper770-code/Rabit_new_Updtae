import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MagneticButton } from "@/components/jr/MagneticButton";
import { useReveal } from "@/lib/useReveal";
import { Mail, MapPin, Phone, Clock, Check, MessageSquare, Beaker, HelpCircle } from "lucide-react";
import vial from "@/assets/vial.jpg";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Talk to a Jacked Rabbits Specialist" },
      { name: "description", content: "Reach the Jacked Rabbits lab and support team. Protocol questions, batch verification, wholesale inquiries." },
      { property: "og:title", content: "Contact — Jacked Rabbits" },
      { property: "og:description", content: "Talk to a real human. Real fast. Real answers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  useReveal();
  const [sent, setSent] = useState(false);
  const [topic, setTopic] = useState("Protocol help");

  return (
    <main className="relative min-h-screen pt-28 bg-slate-50 font-sans text-slate-800 antialiased selection:bg-[rgb(43_90_143)]/10 selection:text-[rgb(43_90_143)]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white py-16 md:py-24">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-15"
          style={{
            backgroundImage: `url(${vial})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "grayscale(1) contrast(1.05)",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/80 via-white/90 to-white" />
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-end md:px-12">
          <div>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
              / Talk to us
            </span>
            <h1 className="mt-3 font-sans font-extrabold text-5xl tracking-tight text-slate-900 md:text-7xl leading-none">
              Real humans.<br />
              <span className="text-[rgb(93_138_111)]">Real answers.</span>
            </h1>
          </div>
          <p className="max-w-md font-sans text-sm leading-relaxed text-slate-600 md:text-base">
            Whether you need protocol advice, a batch verification, or you're a
            gym owner asking about wholesale — a specialist will respond within
            one business hour, seven days a week.
          </p>
        </div>
      </section>

      {/* Contact grid */}
      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-3 md:px-12">
          {[
            { i: Mail, t: "Email", v: "lab@jackedrabbits.com", s: "Response within 1 hr", c: "blue" },
            { i: Phone, t: "Phone", v: "+1 (833) JR-STACK", s: "Mon–Sun · 6a–10p PT", c: "green" },
            { i: MapPin, t: "Lab HQ", v: "Reno, Nevada · USA", s: "By appointment only", c: "blue" },
          ].map((c) => (
            <div
              key={c.t}
              data-magnetic
              className="reveal group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: c.c === "blue" ? "rgba(43, 90, 143, 0.25)" : "rgba(93, 138, 111, 0.25)",
                  background: c.c === "blue" ? "rgba(43, 90, 143, 0.06)" : "rgba(93, 138, 111, 0.06)",
                }}
              >
                <c.i
                  className="h-5 w-5"
                  style={{ color: c.c === "blue" ? "rgb(43 90 143)" : "rgb(93 138 111)" }}
                />
              </div>
              <div className="mt-6 font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {c.t}
              </div>
              <div className="mt-1 font-sans font-extrabold text-2xl text-slate-900">{c.v}</div>
              <div className="mt-3 flex items-center gap-2 font-sans text-xs font-semibold text-slate-500">
                <Clock className="h-3.5 w-3.5 text-slate-400" /> {c.s}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form + sidebar */}
      <section className="pb-24 pt-4">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-12 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm md:p-12">
            {sent ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full border border-[rgb(93_138_111)]/30 bg-[rgb(93_138_111)]/10"
                >
                  <Check className="h-8 w-8 text-[rgb(93_138_111)]" />
                </div>
                <h2 className="mt-8 font-sans font-extrabold text-4xl text-slate-900 md:text-5xl">
                  Message <span className="text-[rgb(93_138_111)]">received.</span>
                </h2>
                <p className="mt-4 max-w-md font-sans text-sm leading-relaxed text-slate-600">
                  A specialist will reach you at the email you provided within
                  one business hour.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-8 font-sans text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
                >
                  ← Send another
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="flex flex-col gap-6"
              >
                <div>
                  <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(93_138_111)]">
                    / Send a message
                  </span>
                  <h2 className="mt-2 font-sans font-extrabold text-3xl tracking-tight text-slate-900 md:text-4xl">
                    Tell us what you need.
                  </h2>
                </div>

                <div>
                  <div className="mb-3 font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    What's this about?
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Protocol help", "Batch verification", "Wholesale", "Press", "Other"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTopic(t)}
                        className={`rounded-full border px-4 py-2 font-sans text-xs font-semibold uppercase tracking-wider transition-all ${
                          topic === t
                            ? "border-[rgb(43_90_143)] bg-[rgb(43_90_143)] text-white shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Name" name="name" required />
                  <Field label="Email" name="email" type="email" required />
                </div>
                <Field label="Subject" name="subject" required />
                <label className="flex flex-col gap-1.5">
                  <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Message
                  </span>
                  <textarea
                    required
                    rows={6}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-sans text-sm text-slate-900 placeholder:text-slate-400 focus:border-[rgb(43_90_143)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[rgb(43_90_143)] transition-all"
                    placeholder="Tell us your goals, current protocol, and where you're stuck…"
                  />
                </label>
                <label className="flex items-center gap-3 font-sans text-xs font-medium text-slate-600">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[rgb(93_138_111)] focus:ring-[rgb(93_138_111)] accent-[rgb(93_138_111)]" />
                  Subscribe to the Jacked Rabbits Journal — protocols, lab data, athlete features.
                </label>
                <div>
                  <MagneticButton variant="green" type="submit">
                    Send message
                  </MagneticButton>
                </div>
              </form>
            )}
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
              <div className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
                / Fastest path
              </div>
              <ul className="mt-6 space-y-6 text-sm">
                {[
                  { i: MessageSquare, t: "Protocol help", s: "Chat with a certified prep coach." },
                  { i: Beaker, t: "Batch COAs", s: "Reply with your order # for the lot report." },
                  { i: HelpCircle, t: "General FAQ", s: "Shipping, storage, reconstitution guides." },
                ].map((r) => (
                  <li key={r.t} className="flex items-start gap-3.5">
                    <div className="rounded-lg bg-[rgb(93_138_111)]/10 p-2 text-[rgb(93_138_111)]">
                      <r.i className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-sans font-bold text-base text-slate-900">{r.t}</div>
                      <div className="font-sans text-xs text-slate-500 mt-0.5">{r.s}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[rgb(43_90_143)]/5 to-[rgb(93_138_111)]/10 p-8 shadow-sm">
              <div className="font-sans text-xs font-bold uppercase tracking-widest text-slate-700">
                / Emergency
              </div>
              <p className="mt-3 font-sans text-xs leading-relaxed text-slate-600">
                Peptides are for research use only. If you're experiencing an
                adverse reaction, contact your physician or Poison Control at
                <span className="font-bold text-slate-900"> 1-800-222-1222</span>.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200/80 bg-white py-24">
        <div className="mx-auto max-w-4xl px-6 md:px-12">
          <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
            / FAQ
          </span>
          <h2 className="mt-2 font-sans font-extrabold text-4xl tracking-tight text-slate-900 md:text-5xl">
            The <span className="text-[rgb(93_138_111)]">quick hits.</span>
          </h2>
          <div className="mt-10 divide-y divide-slate-200/80 border-y border-slate-200/80">
            {[
              { q: "How fast do you ship?", a: "24-hour dispatch on every order, Monday through Saturday. Cold-chain express arrives in 2–3 business days anywhere in the continental US." },
              { q: "How are peptides shipped cold?", a: "Every order goes out in an insulated pouch with reusable gel packs, temperature-logged for the full transit window." },
              { q: "Can I get the lab report for my batch?", a: "Yes. Every product page links to the batch COA, and we'll happily email a signed copy referencing your order number." },
              { q: "Do you offer wholesale?", a: "Yes — for licensed research organizations, clinics, and vetted supplement retailers. Reach out through the form above with 'Wholesale' selected." },
              { q: "Is this legal?", a: "All products are sold strictly for research purposes and are not for human consumption. You must be 21+ to purchase." },
            ].map((f) => (
              <details key={f.q} className="group py-6">
                <summary className="flex cursor-pointer items-center justify-between font-sans font-bold text-xl text-slate-900 hover:text-[rgb(43_90_143)] transition-colors">
                  {f.q}
                  <span className="ml-4 font-sans text-2xl text-slate-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl font-sans text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <input
        {...rest}
        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-sans text-sm text-slate-900 placeholder:text-slate-400 focus:border-[rgb(43_90_143)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[rgb(43_90_143)] transition-all"
      />
    </label>
  );
}