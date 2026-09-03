import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PRODUCTS, CATEGORIES, type Category } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useReveal } from "@/lib/useReveal";
import { Search, Check, ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  tag: string | null;
  price: number;
  img: string | null;
  accent: string | null;
  category: string | null;
  summary: string | null;
  description: string | null;
  specs: Array<{
    label: string;
    value: string;
  }> | null;
  stack: string[] | null;
  stock: number | null;
};

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop — Jacked Rabbits Peptide Catalogue" },
      {
        name: "description",
        content:
          "Browse HPLC-verified research peptides for recovery, growth, metabolic adaptation, and longevity.",
      },
      { property: "og:title", content: "Shop the Catalogue — Jacked Rabbits" },
      {
        property: "og:description",
        content:
          "Every compound purity-tested above 98%. Cold-chain shipping. Independent labs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    cat: (s.cat as string | undefined) ?? undefined,
    q: (s.q as string | undefined) ?? undefined,
    sort: (s.sort as string | undefined) ?? undefined,
  }),
  component: ShopPage,
});

const SORTS = [
  { key: "popularity", label: "Most popular" },
  { key: "price-asc", label: "Price · low to high" },
  { key: "price-desc", label: "Price · high to low" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

function ShopPage() {
  useReveal();

  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [q, setQ] = useState(search.q ?? "");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const PRODUCTS_PER_PAGE = 10;

  const [currentPage, setCurrentPage] = useState(1);

  const cat: Category = (CATEGORIES as readonly string[]).includes(
    search.cat ?? ""
  )
    ? (search.cat as Category)
    : "All";

  const sort: SortKey = (
    SORTS.some((s) => s.key === search.sort)
      ? search.sort
      : "popularity"
  ) as SortKey;

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          tag,
          price,
          img,
          accent,
          category,
          summary,
          description,
          specs,
          stack,
          stock
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch products:", error);
        setError(error.message);
        setProducts([]);
      } else {
        setProducts(
          (data ?? []).map((product) => ({
            ...product,
            price: Number(product.price),
          }))
        );
      }

      setLoading(false);
    }

    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      if (cat !== "All" && p.category !== cat) {
        return false;
      }

      if (
        q &&
        !`${p.name} ${p.tag ?? ""} ${p.summary ?? ""}`
          .toLowerCase()
          .includes(q.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

    const sorted = [...list];

    if (sort === "price-asc") {
      sorted.sort((a, b) => a.price - b.price);
    }

    if (sort === "price-desc") {
      sorted.sort((a, b) => b.price - a.price);
    }

    if (sort === "popularity") {
      sorted.sort((a, b) => {
        return (
          products.findIndex((x) => x.id === b.id) -
          products.findIndex((x) => x.id === a.id)
        );
      });
    }

    return sorted;
  }, [products, cat, q, sort]);

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedProducts = filtered.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [cat, q, sort]);

  const filterContent = (
    <>
      <div className="group relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[rgb(43_90_143)]" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            navigate({
              search: (prev: any) => ({
                ...prev,
                q: e.target.value || undefined,
              }),
            });
          }}
          placeholder="Search compounds..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 font-sans text-xs text-slate-900 placeholder:text-slate-400 shadow-sm transition-all duration-200 hover:border-slate-300 focus:border-[rgb(43_90_143)] focus:outline-none focus:ring-2 focus:ring-[rgb(43_90_143)]/15"
        />
      </div>

      <div className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Category
      </div>
      <ul className="mt-3 space-y-1">
        {CATEGORIES.map((c) => (
          <li key={c}>
            <button
              onClick={() => {
                navigate({
                  search: (prev: any) => ({
                    ...prev,
                    cat: c === "All" ? undefined : c,
                  }),
                });
                setMobileFiltersOpen(false);
              }}
              className={`group relative flex w-full items-center justify-between rounded-lg border-l-2 py-2.5 pl-3 pr-2 text-left font-sans text-xs font-bold uppercase tracking-wider transition-all duration-200 ${cat === c
                  ? "border-[rgb(43_90_143)] bg-white text-[rgb(43_90_143)] shadow-sm"
                  : "border-transparent text-slate-500 hover:bg-slate-100/70 hover:pl-4 hover:text-[rgb(43_90_143)]"
                }`}
            >
              <span>{c}</span>
              {cat === c && (
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(43_90_143)]" />
              )}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Sort by
      </div>
      <ul className="mt-3 space-y-1">
        {SORTS.map((s) => (
          <li key={s.key}>
            <button
              onClick={() => {
                navigate({
                  search: (prev: any) => ({
                    ...prev,
                    sort: s.key === "popularity" ? undefined : s.key,
                  }),
                });
                setMobileFiltersOpen(false);
              }}
              className={`group flex w-full items-center justify-between rounded-lg border-l-2 py-2.5 pl-3 pr-2 text-left font-sans text-xs transition-all duration-200 ${sort === s.key
                  ? "border-[rgb(93_138_111)] bg-white font-bold text-[rgb(93_138_111)] shadow-sm"
                  : "border-transparent font-medium text-slate-500 hover:bg-slate-100/70 hover:pl-4 hover:text-[rgb(93_138_111)]"
                }`}
            >
              <span>{s.label}</span>
              {sort === s.key && (
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(93_138_111)]" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 pt-16 font-sans text-slate-800 antialiased selection:bg-[rgb(43_90_143)]/10 selection:text-[rgb(43_90_143)] sm:pt-28">
      {/* Header Container */}
      <section className="w-full border-b border-slate-200/80 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-2 px-3 py-4 text-center sm:px-6 sm:py-12 sm:text-left md:px-12">
          <div className="w-full sm:w-auto">
            <span className="font-sans text-[9px] font-bold uppercase tracking-widest text-[rgb(43_90_143)] sm:text-xs">
              Catalogue
            </span>

            <h1 className="mt-0.5 font-sans text-xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-6xl">
              Research peptides
            </h1>
          </div>

          <p className="mx-auto max-w-sm font-sans text-[11px] leading-tight text-slate-600 sm:mx-0 sm:text-sm">
            {products.length} compounds available. Select a compound to view
            specifications, variants, pricing, and details.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-12 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10 md:px-12">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
          {filterContent}
        </aside>

        {/* Mobile Filter Controls */}
        <div className="flex items-center justify-between mb-3 lg:hidden">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-sans text-[11px] font-bold text-slate-700 shadow-xs transition-all hover:bg-slate-50 active:scale-95"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[rgb(43_90_143)]" />
            <span>Filter & Sort</span>
          </button>
          <span className="font-sans text-[11px] font-semibold text-slate-500">
            {filtered.length} {filtered.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Mobile Filter Drawer Modal */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex bg-slate-900/40 backdrop-blur-xs lg:hidden">
            <div className="relative ml-auto h-full w-full max-w-xs overflow-y-auto bg-slate-50 p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                <span className="font-sans text-sm font-bold uppercase tracking-wider text-slate-900">
                  Filters
                </span>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {filterContent}
            </div>
          </div>
        )}

        {/* Main Product Area */}
        <section className="w-full">
          <div className="mb-3 flex flex-wrap items-center gap-1.5 sm:mb-6 sm:gap-2">
            <span className="hidden font-sans text-xs font-bold uppercase tracking-wider text-slate-400 lg:inline-block lg:mr-2">
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </span>

            {cat !== "All" && (
              <Chip
                label={cat}
                onClear={() =>
                  navigate({
                    search: (p: any) => ({
                      ...p,
                      cat: undefined,
                    }),
                  })
                }
              />
            )}

            {q && (
              <Chip
                label={`“${q}”`}
                onClear={() => {
                  setQ("");
                  navigate({
                    search: (p: any) => ({
                      ...p,
                      q: undefined,
                    }),
                  });
                }}
              />
            )}

            <Chip
              label={SORTS.find((s) => s.key === sort)!.label}
              tone="green"
              onClear={
                sort === "popularity"
                  ? undefined
                  : () =>
                    navigate({
                      search: (p: any) => ({
                        ...p,
                        sort: undefined,
                      }),
                    })
              }
            />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-sm sm:p-12">
              <p className="font-sans text-lg font-extrabold text-slate-900 sm:text-3xl">
                No matches found
              </p>
              <p className="mt-1 font-sans text-xs text-slate-500 sm:text-sm">
                Try adjusting your search query or clearing active filters.
              </p>
            </div>
          ) : (
            <>
              {/* Responsive 2-column mobile grid without horizontal scroll */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-1 lg:gap-4">
                {paginatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
                  <div className="text-[11px] font-semibold text-slate-400">
                    Showing{" "}
                    <span className="text-slate-700">{startIndex + 1}</span>
                    {" – "}
                    <span className="text-slate-700">
                      {Math.min(endIndex, filtered.length)}
                    </span>
                    {" of "}
                    <span className="text-slate-700">{filtered.length}</span>{" "}
                    products
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage((page) => Math.max(1, page - 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-all hover:border-[rgb(43_90_143)] hover:text-[rgb(43_90_143)] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-xs"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1
                      ).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-xs font-bold transition-all sm:h-9 sm:min-w-9 sm:px-3 ${currentPage === page
                              ? "bg-[rgb(43_90_143)] text-white shadow-xs"
                              : "border border-slate-200 bg-white text-slate-500 hover:border-[rgb(43_90_143)] hover:text-[rgb(43_90_143)]"
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage((page) =>
                          Math.min(totalPages, page + 1)
                        );
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-all hover:border-[rgb(43_90_143)] hover:text-[rgb(43_90_143)] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-xs"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <div className="py-6" />
    </main>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-xs transition-all duration-300 hover:border-[rgb(43_90_143)]/40 hover:bg-slate-50/80 hover:shadow-md sm:p-4 lg:flex-row lg:items-center lg:rounded-2xl lg:p-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6">
        {/* COMPACT IMAGE CONTAINER */}
        <Link
          to="/shop/$productId"
          params={{ productId: product.id }}
          className="relative block h-32 w-full overflow-hidden rounded-lg border border-slate-200/80 bg-slate-50 shadow-xs transition-colors group-hover:border-[rgb(43_90_143)]/30 sm:h-44 lg:h-28 lg:w-28 lg:shrink-0"
        >
          {product.img ? (
            <img
              src={product.img}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-50 text-[10px] font-bold uppercase text-slate-400">
              No Image
            </div>
          )}
        </Link>

        {/* DETAILS */}
        <div className="min-w-0 flex-1">
          <div className="font-sans text-[8px] font-bold uppercase tracking-wider text-[rgb(43_90_143)] sm:text-[10px] lg:text-[11px]">
            {product.category || "Research Compound"}
          </div>

          <Link
            to="/shop/$productId"
            params={{ productId: product.id }}
            className="mt-0.5 block truncate font-sans text-xs font-extrabold text-slate-900 transition-colors duration-200 hover:text-[rgb(43_90_143)] sm:text-base lg:text-2xl"
          >
            {product.name}
          </Link>

          {product.summary && (
            <p className="mt-1 hidden line-clamp-2 font-sans text-xs leading-relaxed text-slate-600 lg:block lg:max-w-lg lg:text-sm">
              {product.summary}
            </p>
          )}

          <div className="mt-1 flex flex-wrap gap-1 lg:gap-2">
            {product.tag && product.tag !== product.category && (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500 sm:text-[9px] lg:px-3 lg:py-1 lg:text-[10px]">
                {product.tag}
              </span>
            )}

            {product.specs?.slice(0, 1).map((spec) => (
              <span
                key={spec.label}
                className="rounded-full bg-[rgb(43_90_143)]/5 px-1.5 py-0.5 text-[8px] font-semibold text-[rgb(43_90_143)] sm:text-[9px] lg:px-3 lg:py-1 lg:text-[10px]"
              >
                {spec.label}: {spec.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA BUTTON */}
      <div className="mt-2 flex items-center justify-end border-t border-slate-100 pt-2 lg:mt-0 lg:border-0 lg:pt-0">
        <Link
          to="/shop/$productId"
          params={{ productId: product.id }}
          className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-[rgb(43_90_143)] py-1.5 font-sans text-[9px] font-bold uppercase tracking-wider text-white shadow-xs transition-all duration-200 hover:bg-[rgb(35_74_119)] hover:shadow-md active:scale-95 sm:text-[10px] lg:w-auto lg:rounded-full lg:px-5 lg:py-2.5 lg:text-xs"
        >
          <span>View details</span>
          <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5 lg:h-3.5 lg:w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Chip({
  label,
  onClear,
  tone = "blue",
}: {
  label: string;
  onClear?: () => void;
  tone?: "blue" | "green";
}) {
  const isGreen = tone === "green";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-sans text-[9px] font-bold transition-all sm:text-xs ${isGreen
          ? "border-[rgb(93_138_111)]/30 bg-[rgb(93_138_111)]/10 text-[rgb(93_138_111)]"
          : "border-[rgb(43_90_143)]/30 bg-[rgb(43_90_143)]/10 text-[rgb(43_90_143)]"
        }`}
    >
      {label}
      {onClear && (
        <button
          onClick={onClear}
          aria-label={`Clear ${label}`}
          className="ml-0.5 text-xs font-extrabold opacity-60 hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}