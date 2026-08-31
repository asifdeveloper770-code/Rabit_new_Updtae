import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { MagneticButton } from "@/components/jr/MagneticButton";
import { supabase } from "@/lib/supabase";
import {
  Check,
  ShoppingBag,
  ShieldCheck,
  Thermometer,
  Beaker,
} from "lucide-react";

export const Route = createFileRoute("/shop/$productId")({
  component: ProductDetail,
});

type ProductVariant = {
  id: string; // uuid
  product_id: string;
  id_number: string;
  cas_number: string | null;
  specification: string;
  price: number;
  quantity: number | null;
  stock: number | null;
  img?: string | null; // Variant specific image
  created_at: string;
};

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
  specs: {
    label: string;
    value: string;
  }[] | null;
  stack: string[] | null;
  stock: number | null;
};

function ProductDetail() {
  const { productId } = Route.useParams();
  const { add } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

 useEffect(() => {
  async function fetchProductAndVariants() {
    setLoading(true);
    setError("");

    // 1. Fetch Product by URL parameter / slug
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select(`
        uuid_id,
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
      .eq("id", productId) // Or .eq("slug", productId) depending on your schema
      .single();

    if (productError) {
      console.error("Failed to fetch product:", productError);
      setError(productError.message);
      setProduct(null);
      setLoading(false);
      return;
    }

    const formattedProduct = {
      ...productData,
      price: Number(productData.price),
    };
    setProduct(formattedProduct);

    // 2. Fetch Variants using the database UUID retrieved from Step 1
    const { data: variantsData, error: variantsError } = await supabase
      .from("product_variations")
      .select("*")
      .eq("product_id", productData.uuid_id) // <-- Pass the internal UUID here
      .order("price", { ascending: true });

    if (variantsError) {
      console.error("Failed to fetch variants:", variantsError);
    } else if (variantsData && variantsData.length > 0) {
      const formattedVariants: ProductVariant[] = variantsData.map((v) => ({
        ...v,
        price: Number(v.price),
      }));
      setVariants(formattedVariants);
      setSelectedVariant(formattedVariants[0]);
    }

    setLoading(false);
  }

  fetchProductAndVariants();
}, [productId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 pt-32">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[rgb(43_90_143)]" />
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Loading product details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-screen bg-slate-50 pt-32">
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <h1 className="text-3xl font-extrabold text-slate-900">
              Product not found
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              {error || "This product could not be found."}
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex rounded-full bg-[rgb(43_90_143)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const accent =
    product.accent === "blue" ? "rgb(43 90 143)" : "rgb(93 138 111)";

  const specs = Array.isArray(product.specs) ? product.specs : [];

  // Determine active display image: variant image first, fallback to base product image
  const displayImage = selectedVariant?.img || product.img;

  // Active price and stock resolve from selected variant or fallback to base product
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant
    ? Number(selectedVariant.stock ?? 0)
    : Number(product.stock ?? 0);

  const handleAddToCart = (variantToUse = selectedVariant) => {
    if (currentStock <= 0) return;

    // Use selected variant ID if present, otherwise fall back to base product ID
    const itemId = variantToUse ? variantToUse.id : product.id;

    // Add item and quantity to cart state
    add(itemId, qty);

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <main className="relative min-h-screen bg-slate-50 pt-28 font-sans text-slate-800 antialiased">
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Link
            to="/shop"
            className="transition-colors hover:text-slate-900"
          >
            Shop
          </Link>
          <span>/</span>
          <span className="text-slate-700">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
          {/* ================= MAIN IMAGE ================= */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-2 shadow-sm">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={selectedVariant ? `${product.name} - ${selectedVariant.specification}` : product.name}
                  className="aspect-square w-full rounded-2xl object-cover transition-all duration-300"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-slate-100 text-sm font-bold uppercase text-slate-400">
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* ================= PRODUCT INFO ================= */}
          <div className="flex flex-col gap-7">
            {/* Category */}
            <div>
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: accent }}
              >
                {product.category}
              </span>

              <h1 className="mt-2 text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
                {product.name}
              </h1>

              {product.tag && (
                <div className="mt-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  {product.tag}
                </div>
              )}

              {product.summary && (
                <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600">
                  {product.summary}
                </p>
              )}
            </div>

            {/* Price / Stock */}
            <div className="flex flex-wrap items-center gap-6 border-y border-slate-200/80 py-6">
              <div className="text-4xl font-extrabold text-slate-900">
                ${currentPrice.toFixed(2)}
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${currentStock > 0
                  ? "border border-[rgb(93_138_111)]/30 bg-[rgb(93_138_111)]/10 text-[rgb(93_138_111)]"
                  : "border border-red-200 bg-red-50 text-red-500"
                  }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${currentStock > 0
                    ? "animate-pulse bg-[rgb(93_138_111)]"
                    : "bg-red-500"
                    }`}
                />
                {currentStock > 0
                  ? `In stock${currentStock ? ` · ${currentStock} available` : ""}`
                  : "Out of stock"}
              </div>
            </div>

            {/* ================= PRODUCT VARIANTS ================= */}
            {variants.length > 0 && (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: accent }}
                >
                  Available options
                </span>
                <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                  Select Specification
                </h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const variantImg = v.img || product.img;

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${isSelected
                          ? "border-[rgb(43_90_143)] bg-slate-50 ring-1 ring-[rgb(43_90_143)] shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                      >
                        {/* Variant Thumbnail */}
                        {variantImg ? (
                          <img
                            src={variantImg}
                            alt={v.specification}
                            className="h-14 w-14 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase flex-shrink-0">
                            No Img
                          </div>
                        )}

                        <div className="flex flex-col justify-between w-full">
                          <div className="flex w-full items-center justify-between">
                            <span className="text-xs font-bold text-slate-400">
                              #{v.id_number}
                            </span>
                            {v.cas_number && (
                              <span className="text-[10px] text-slate-400">
                                CAS: {v.cas_number}
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-extrabold text-slate-900">
                            {v.specification}
                          </div>
                          <div className="text-sm font-extrabold text-[rgb(43_90_143)]">
                            ${v.price.toFixed(2)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ================= DETAILS & SPECS ================= */}
            {product.description && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Product details
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {product.description}
                </p>
              </div>
            )}

            {specs.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Specifications
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {specs.map((spec, index) => (
                    <div
                      key={`${spec.label}-${index}`}
                      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {spec.label}
                      </div>
                      <div className="mt-1 text-base font-extrabold text-slate-900">
                        {spec.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= CART ACTION ================= */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => setQty((value) => Math.max(1, value - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
                >
                  −
                </button>
                <div className="w-10 text-center text-lg font-extrabold text-slate-900">
                  {qty}
                </div>
                <button
                  onClick={() => setQty((value) => value + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
                >
                  +
                </button>
              </div>

              <MagneticButton
                variant={
                  product.accent === "blue" || product.accent === "green"
                    ? product.accent
                    : undefined
                }
                onClick={() => handleAddToCart()}
              >
                {added ? (
                  <span className="inline-flex items-center gap-2">
                    <Check className="h-3.5 w-3.5" />
                    Added
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Add {qty} to cart
                  </span>
                )}
              </MagneticButton>

              <Link
                to="/checkout"
                className="text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900"
              >
                Go to checkout →
              </Link>
            </div>

            {/* ================= INFO BADGES ================= */}
            <div className="grid grid-cols-3 gap-3">
              <InfoBadge icon={ShieldCheck} label="Verified" />
              <InfoBadge icon={Thermometer} label="Cold-chain" />
              <InfoBadge icon={Beaker} label="Lab tested" />
            </div>
          </div>
        </div>

        <div className="py-16" />
      </div>
    </main>
  );
}

function InfoBadge({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm">
      <Icon className="h-4 w-4 text-slate-700" />
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
    </div>
  );
}