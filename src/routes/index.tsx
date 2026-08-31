import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { Hero } from "@/components/jr/Hero";
import { useReveal } from "@/lib/useReveal";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface FeaturedProduct {
  id: string;
  name: string;
  category: string | null;
  price: number | string;
  img: string | null;
  summary: string | null;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Jacked Rabbits — Research Peptides for the Relentless",
      },
      {
        name: "description",
        content:
          "High-purity research peptides engineered for recovery, growth, and metabolic adaptation. Independently lab-verified.",
      },
      {
        property: "og:title",
        content:
          "Jacked Rabbits — Build. Recover. Adapt.",
      },
      {
        property: "og:description",
        content:
          "Research-grade peptides for athletes who refuse average. HPLC-verified. Independently tested.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),

  component: Index,
});

function Index() {
  useReveal();

  const navigate = useNavigate();

  const [featured, setFeatured] = useState<FeaturedProduct[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchFeaturedProducts = async () => {
      try {
        setFeaturedLoading(true);

        const { data, error } = await supabase
          .from("products")
          .select(
            "id, name, category, price, img, summary"
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(4);

        if (error) {
          console.error(
            "Failed to fetch featured products:",
            error
          );

          if (mounted) {
            setFeatured([]);
          }

          return;
        }

        if (mounted) {
          setFeatured(
            (data || []) as FeaturedProduct[]
          );
        }
      } catch (error) {
        console.error(
          "Unexpected error fetching featured products:",
          error
        );

        if (mounted) {
          setFeatured([]);
        }
      } finally {
        if (mounted) {
          setFeaturedLoading(false);
        }
      }
    };

    fetchFeaturedProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const openProduct = (productId: string) => {
    navigate({
      to: "/shop/$productId",
      params: {
        productId,
      },
    });
  };

  return (
    <main className="relative overflow-x-hidden bg-slate-50 font-sans text-slate-800 antialiased selection:bg-[rgb(43_90_143)]/10 selection:text-[rgb(43_90_143)]">
      <Hero />

      {/* =====================================================
          CREDIBILITY BAR
      ====================================================== */}
      <section className="mt-10 border-y border-slate-200/80 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 md:px-12">
          <span>ISO-17025 Tested</span>

          <span className="hidden h-3 w-px bg-slate-200 md:block" />

          <span>Cold-Chain Shipping</span>

          <span className="hidden h-3 w-px bg-slate-200 md:block" />

          <span>Batch COA Included</span>

          <span className="hidden h-3 w-px bg-slate-200 md:block" />

          <span>USA Formulated</span>
        </div>
      </section>

      {/* =====================================================
          FEATURED PRODUCTS
      ====================================================== */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-12">

          {/* Header */}
          <div className="reveal flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
                Featured Stacks
              </span>

              <h2 className="mt-1 font-sans text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                Selected Compounds
              </h2>
            </div>

            <Link
              to="/shop"
              className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
            >
              Full Catalogue →
            </Link>
          </div>

          {/* Product List */}
          <ul className="divide-y divide-slate-100">

            {/* =================================================
                LOADING SKELETON
            ================================================== */}
            {featuredLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <li
                  key={`product-loading-${i}`}
                  className="animate-pulse"
                >
                  <div className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-5 py-6 md:grid-cols-[80px_minmax(180px,1.2fr)_minmax(250px,2fr)_auto] md:gap-8 md:px-6">

                    {/* Image skeleton */}
                    <div className="h-16 w-16 rounded-xl bg-slate-100 md:h-20 md:w-20" />

                    {/* Product skeleton */}
                    <div className="min-w-0">
                      <div className="mb-2 h-3 w-20 rounded bg-slate-100" />

                      <div className="h-6 w-40 rounded bg-slate-100" />
                    </div>

                    {/* Summary skeleton */}
                    <div className="hidden md:block">
                      <div className="h-3 w-64 rounded bg-slate-100" />

                      <div className="mt-2 h-3 w-48 rounded bg-slate-100" />
                    </div>

                    {/* Price skeleton */}
                    <div className="h-6 w-20 rounded bg-slate-100" />
                  </div>
                </li>
              ))}

            {/* =================================================
                PRODUCTS FROM SUPABASE
            ================================================== */}
            {/* PRODUCTS FROM SUPABASE */}
{!featuredLoading && featured.length > 0 &&
  featured.map((p, i) => (
    <li
      key={p.id}
      className=""
      style={{
        transitionDelay: `${i * 50}ms`,
      }}
    >
      <Link
        to="/shop/$productId"
        params={{ productId: p.id }}
        
        className="
          group
          grid
          cursor-pointer
          grid-cols-[64px_minmax(0,1fr)_auto]
          items-center
          gap-5
          py-6
          transition-all
          duration-200
          hover:bg-slate-50/80
          md:grid-cols-[80px_minmax(180px,1.2fr)_minmax(250px,2fr)_auto]
          md:gap-8
          md:rounded-2xl
          md:px-6
        "
      >
        {/* PRODUCT IMAGE */}
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 shadow-sm">
          {p.img ? (
            <img
              src={p.img}
              alt={p.name}
              loading="lazy"
              width={160}
              height={160}
              className="h-16 w-16 object-cover transition-transform duration-500 group-hover:scale-105 md:h-20 md:w-20"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center text-[9px] font-bold text-slate-400 md:h-20 md:w-20">
              NO IMG
            </div>
          )}
        </div>

        {/* PRODUCT NAME + CATEGORY */}
        <div className="min-w-0">
          <div className="font-sans text-[11px] font-semibold uppercase tracking-wider text-[rgb(43_90_143)]">
            {p.category || "Research"}
          </div>

          <div className="mt-0.5 truncate font-sans text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            {p.name}
          </div>
        </div>

        {/* SUMMARY */}
        <p className="hidden min-w-0 font-sans text-xs font-normal leading-relaxed text-slate-500 md:block">
          {p.summary || "Research-grade compound."}
        </p>

        {/* PRICE */}
        <div className="whitespace-nowrap text-right font-sans text-xl font-bold text-slate-900 md:text-2xl">
          ${Number(p.price).toFixed(2)}
        </div>
      </Link>
    </li>
  ))}
          </ul>

          {/* =====================================================
              EMPTY STATE
          ====================================================== */}
          {!featuredLoading &&
            featured.length === 0 && (
              <div className="py-16 text-center">
                <p className="font-sans text-sm text-slate-400">
                  No products available.
                </p>

                <Link
                  to="/shop"
                  className="mt-4 inline-block font-sans text-xs font-bold uppercase tracking-wider text-[rgb(43_90_143)] hover:underline"
                >
                  View Catalogue →
                </Link>
              </div>
            )}
        </div>
      </section>

      {/* =====================================================
          STANDARD / PURITY SECTION
      ====================================================== */}

      {/*
      <section className="border-t border-slate-200/80 bg-slate-100/60 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:px-12">

          <div className="reveal order-2 flex flex-col gap-6 md:order-1">
            <div>
              <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
                Our Standard
              </span>

              <h2 className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl md:leading-tight">
                Purity you can audit.
              </h2>
            </div>

            <p className="max-w-md font-sans text-sm leading-relaxed text-slate-600">
              Every lot is analysed by an independent ISO-17025 laboratory before
              it ships. No pass, no ship — and we publish the numbers on the
              product page.
            </p>

            <div className="grid grid-cols-3 gap-6 border-t border-slate-200/80 pt-6">
              {[
                { k: "99.4%", v: "Avg Purity" },
                { k: "0.0%", v: "Endotoxin" },
                { k: "24h", v: "Dispatch" },
              ].map((s) => (
                <div key={s.v}>
                  <div className="font-sans text-2xl font-black text-slate-900 md:text-3xl">
                    {s.k}
                  </div>

                  <div className="mt-1 font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <MagneticButton to="/science" variant="blue">
                Read the science
              </MagneticButton>
            </div>
          </div>

          <div className="reveal order-1 md:order-2">
            <div className="relative mx-auto max-w-sm rounded-2xl border border-slate-200/80 bg-white p-2 shadow-md">
              <img
                src={vial}
                alt="Independently tested research peptide vial"
                loading="lazy"
                width={1024}
                height={1280}
                className="w-full rounded-xl object-cover"
              />
            </div>
          </div>

        </div>
      </section>
      */}

      {/* =====================================================
          QUOTE + CTA SECTION
      ====================================================== */}

      {/*
      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-6 text-center md:px-12">

          <blockquote className="reveal font-sans text-2xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
            "I've tried every stack. Jacked Rabbits is the standard now."
          </blockquote>

          <div className="reveal mt-4 font-sans text-xs font-semibold uppercase tracking-widest text-slate-400">
            — Marcus K., 4× national powerlifting champion
          </div>

          <div className="reveal mt-10 flex flex-wrap justify-center gap-4">
            <MagneticButton to="/shop" variant="blue">
              Shop the catalogue
            </MagneticButton>

            <MagneticButton to="/contact" variant="ghost">
              Talk to a specialist
            </MagneticButton>
          </div>

        </div>
      </section>
      */}
    </main>
  );
}