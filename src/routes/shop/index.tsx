import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PRODUCTS, CATEGORIES, type Category } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useReveal } from "@/lib/useReveal";
import { Search, Check, ArrowRight } from "lucide-react";
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
  // { key: "purity", label: "Highest purity" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

function purityOf(p: (typeof PRODUCTS)[number]) {
  const spec = p.specs.find((s) => s.label.toLowerCase() === "purity");
  return spec ? parseFloat(spec.value) || 0 : 0;
}

function popularityOf(p: (typeof PRODUCTS)[number]) {
  return PRODUCTS.length - PRODUCTS.findIndex((x) => x.id === p.id);
}

function ShopPage() {
  useReveal();

  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [q, setQ] = useState(search.q ?? "");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const totalPages = Math.ceil(
    filtered.length / PRODUCTS_PER_PAGE
  );

  const startIndex =
    (currentPage - 1) * PRODUCTS_PER_PAGE;

  const endIndex =
    startIndex + PRODUCTS_PER_PAGE;

  const paginatedProducts = filtered.slice(
    startIndex,
    endIndex
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [cat, q, sort]);


  return (
    <main className="relative min-h-screen bg-slate-50 pt-28 font-sans text-slate-800 antialiased selection:bg-[rgb(43_90_143)]/10 selection:text-[rgb(43_90_143)]">
      {/* Page Header */}
      <section className="border-b border-slate-200/80 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-6 py-12 md:px-12">
          <div>
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
              Catalogue
            </span>
            <h1 className="mt-2 font-sans text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
              Research peptides
            </h1>
          </div>
          <p className="max-w-sm font-sans text-sm leading-relaxed text-slate-600">
            {products.length} compounds available. Select a compound to view
            available specifications, variants, pricing, and product details.
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[220px_1fr] md:px-12">
        {/* Sidebar */}
        <aside className="md:sticky md:top-28 md:self-start">
          <div className="group relative mb-8">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[rgb(43_90_143)]" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                navigate({
                  search: (prev: any) => ({ ...prev, q: e.target.value || undefined }),
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
                  onClick={() =>
                    navigate({
                      search: (prev: any) => ({ ...prev, cat: c === "All" ? undefined : c }),
                    })
                  }
                  className={`group relative flex w-full items-center justify-between rounded-lg border-l-2 py-2 pl-3 pr-2 text-left font-sans text-xs font-bold uppercase tracking-wider transition-all duration-200 ${cat === c
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
                  onClick={() =>
                    navigate({
                      search: (prev: any) => ({
                        ...prev,
                        sort: s.key === "popularity" ? undefined : s.key,
                      }),
                    })
                  }
                  className={`group flex w-full items-center justify-between rounded-lg border-l-2 py-2 pl-3 pr-2 text-left font-sans text-xs transition-all duration-200 ${sort === s.key
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
        </aside>

        {/* Product Cards */}
        <section>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="mr-2 font-sans text-xs font-bold uppercase tracking-wider text-slate-400">
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
            <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
              <p className="font-sans text-3xl font-extrabold text-slate-900">
                No matches found
              </p>

              <p className="mt-2 font-sans text-sm text-slate-500">
                Try adjusting your search query or clearing active filters.
              </p>
            </div>
          ) : (
            <>
              {/* Products */}
              <div className="space-y-4">
                {paginatedProducts.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">

                  {/* Results */}
                  <div className="text-xs font-semibold text-slate-400">
                    Showing{" "}
                    <span className="text-slate-700">
                      {startIndex + 1}
                    </span>
                    {" – "}
                    <span className="text-slate-700">
                      {Math.min(
                        endIndex,
                        filtered.length
                      )}
                    </span>
                    {" of "}
                    <span className="text-slate-700">
                      {filtered.length}
                    </span>{" "}
                    products
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">

                    {/* Previous */}
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage((page) =>
                          Math.max(1, page - 1)
                        );

                        window.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition-all hover:border-[rgb(43_90_143)] hover:text-[rgb(43_90_143)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    {/* Pages */}
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

                            window.scrollTo({
                              top: 0,
                              behavior: "smooth",
                            });
                          }}
                          className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition-all ${currentPage === page
                            ? "bg-[rgb(43_90_143)] text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-500 hover:border-[rgb(43_90_143)] hover:text-[rgb(43_90_143)]"
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    {/* Next */}
                    <button
                      type="button"
                      disabled={
                        currentPage === totalPages
                      }
                      onClick={() => {
                        setCurrentPage((page) =>
                          Math.min(
                            totalPages,
                            page + 1
                          )
                        );

                        window.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 transition-all hover:border-[rgb(43_90_143)] hover:text-[rgb(43_90_143)] disabled:cursor-not-allowed disabled:opacity-40"
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

      <div className="py-12" />
    </main>
  );
}

function ProductRow({ product }: { product: Product }) {
  return (
    <div className="group relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[rgb(43_90_143)]/40 hover:bg-slate-50/80 hover:shadow-xl hover:shadow-[rgb(43_90_143)]/5 md:p-6">
      <div className="grid grid-cols-[88px_1fr] items-center gap-5 sm:grid-cols-[112px_1fr_auto] sm:gap-8">

        {/* IMAGE */}
        <Link
          to="/shop/$productId"
          params={{ productId: product.id }}
          className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-colors group-hover:border-[rgb(43_90_143)]/30"
        >
          {product.img ? (
            <img
              src={product.img}
              alt={product.name}
              loading="lazy"
              width={224}
              height={224}
              className="h-[88px] w-[88px] object-cover transition-transform duration-500 group-hover:scale-110 sm:h-28 sm:w-28"
            />
          ) : (
            <div className="flex h-[88px] w-[88px] items-center justify-center bg-slate-50 text-[10px] font-bold uppercase text-slate-400 sm:h-28 sm:w-28">
              No Image
            </div>
          )}
        </Link>

        {/* PRODUCT INFORMATION */}
        <div className="min-w-0">
          {/* CATEGORY */}
          <div className="font-sans text-[11px] font-bold uppercase tracking-wider text-[rgb(43_90_143)]">
            {product.category || "Research Compound"}
          </div>

          {/* NAME */}
          <Link
            to="/shop/$productId"
            params={{ productId: product.id }}
            className="mt-1 block font-sans text-2xl font-extrabold text-slate-900 transition-colors duration-200 hover:text-[rgb(43_90_143)] sm:text-3xl"
          >
            {product.name}
          </Link>

          {/* SHORT DESCRIPTION */}
          {product.summary && (
            <p className="mt-2 max-w-lg font-sans text-sm leading-relaxed text-slate-600">
              {product.summary}
            </p>
          )}

          {/* GENERAL PRODUCT INFO */}
          <div className="mt-3 flex flex-wrap gap-2">
            {product.tag && product.tag !== product.category && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {product.tag}
              </span>
            )}

            {product.specs?.slice(0, 2).map((spec) => (
              <span
                key={spec.label}
                className="rounded-full bg-[rgb(43_90_143)]/5 px-3 py-1 text-[10px] font-semibold text-[rgb(43_90_143)]"
              >
                {spec.label}: {spec.value}
              </span>
            ))}
          </div>
        </div>

        {/* DETAILS BUTTON */}
        <div className="col-span-2 flex items-center justify-end border-t border-slate-100 pt-4 sm:col-span-1 sm:border-0 sm:pt-0">
          <Link
            to="/shop/$productId"
            params={{ productId: product.id }}
            className="inline-flex items-center gap-2 rounded-full bg-[rgb(43_90_143)] px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-200 hover:bg-[rgb(35_74_119)] hover:shadow-md hover:shadow-[rgb(43_90_143)]/20 active:scale-95"
          >
            <span>View variants</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-sans text-xs font-bold transition-all duration-200 hover:scale-105 ${isGreen
        ? "border-[rgb(93_138_111)]/30 bg-[rgb(93_138_111)]/10 text-[rgb(93_138_111)]"
        : "border-[rgb(43_90_143)]/30 bg-[rgb(43_90_143)]/10 text-[rgb(43_90_143)]"
        }`}
    >
      {label}
      {onClear && (
        <button
          onClick={onClear}
          aria-label={`Clear ${label}`}
          className="ml-0.5 text-xs font-extrabold opacity-60 transition-opacity hover:opacity-100"
        >
          ×
        </button>
      )}
    </span>
  );
}