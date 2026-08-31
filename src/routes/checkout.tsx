import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { MagneticButton } from "@/components/jr/MagneticButton";
import { supabase } from "@/lib/supabase";
import {
  Minus,
  Plus,
  Trash2,
  Lock,
  Truck,
  ShieldCheck,
  Check,
  Package,
  Loader2,
  Bitcoin,
} from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Jacked Rabbits" },
      {
        name: "description",
        content:
          "Secure checkout. Cold-chain shipping. HPLC-verified peptides.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const STEPS = ["Cart", "Shipping", "Bitcoin Payment"] as const;

// A resolved cart line: either a base product (looked up by products.id)
// or a variant (looked up by product_variations.id, joined back to its
// parent product for display info).
type Product = {
  id: string; // the id stored in the cart (product.id or variant.id)
  productId: string; // products.id (text) — always the base product, used for order payload
  variationId: string | null; // product_variations.id, when this line is a variant
  name: string;
  tag: string | null;
  price: number;
  img: string | null;
  accent: string | null;
  category: string | null;
  stock: number | null;
};

function CheckoutPage() {
  const { items, setQty, remove, clear } = useCart();
 

  const [step, setStep] = useState(0);
  const [placed, setPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [orderId, setOrderId] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });


useEffect(() => {
  let cancelled = false;

  async function loadProducts() {
    if (items.length === 0) {
      if (!cancelled) {
        setProducts([]);
        setLoadingProducts(false);
        setErrorMessage("");
      }
      return;
    }

    if (!cancelled) {
      setLoadingProducts(true);
      setErrorMessage("");
    }

    const cartIds = [
      ...new Set(items.map((item) => String(item.id).trim()).filter(Boolean)),
    ];

    const resolved = new Map<string, Product>();

    // 1. Try to resolve cart ids as base products (product detail "add to
    // cart" with no variant selected stores products.id here).
    const { data: baseProducts, error: baseError } = await supabase
      .from("products")
      .select("id, name, tag, price, img, accent, category, stock")
      .in("id", cartIds);

    if (baseError) {
      console.error("Product loading error:", baseError);
      if (!cancelled) {
        setProducts([]);
        setErrorMessage(`Unable to load cart products: ${baseError.message}`);
        setLoadingProducts(false);
      }
      return;
    }

    (baseProducts ?? []).forEach((p) => {
      resolved.set(String(p.id), {
        id: String(p.id),
        productId: String(p.id),
        variationId: null,
        name: p.name,
        tag: p.tag,
        price: Number(p.price),
        img: p.img,
        accent: p.accent,
        category: p.category,
        stock: p.stock,
      });
    });

    // 2. Any cart ids not resolved above may be variant selections, which
    // are stored as product_variations.id (a different id space entirely).
    const remainingIds = cartIds.filter((id) => !resolved.has(id));

    if (remainingIds.length > 0) {
      const { data: variants, error: variantError } = await supabase
        .from("product_variations")
        .select("id, product_id, specification, price, stock, img")
        .in("id", remainingIds);

      if (variantError) {
        console.error("Variant loading error:", variantError);
      } else if (variants && variants.length > 0) {
        const parentUuids = [
          ...new Set(variants.map((v) => v.product_id).filter(Boolean)),
        ];

        const { data: parents, error: parentError } = await supabase
          .from("products")
          .select("id, uuid_id, name, tag, img, accent, category")
          .in("uuid_id", parentUuids);

        if (parentError) {
          console.error("Parent product loading error:", parentError);
        }

        const parentByUuid = new Map(
          (parents ?? []).map((p) => [String(p.uuid_id), p])
        );

        variants.forEach((v) => {
          const parent = parentByUuid.get(String(v.product_id));

          resolved.set(String(v.id), {
            id: String(v.id),
            productId: parent ? String(parent.id) : String(v.id),
            variationId: String(v.id),
            name: parent ? `${parent.name} — ${v.specification}` : v.specification,
            tag: parent?.tag ?? null,
            price: Number(v.price),
            img: v.img || parent?.img || null,
            accent: parent?.accent ?? null,
            category: parent?.category ?? null,
            stock: v.stock,
          });
        });
      }
    }

    const missingIds = cartIds.filter((id) => !resolved.has(id));

    if (missingIds.length > 0) {
      console.warn("Purging missing product IDs from cart:", missingIds);
      missingIds.forEach((id) => remove(id));
      setErrorMessage(
        "Some items in your cart are no longer available and were removed."
      );
    }

    if (!cancelled) {
      setProducts(Array.from(resolved.values()));
      setLoadingProducts(false);
    }
  }

  loadProducts();

  return () => {
    cancelled = true;
  };
}, [items]);

  // Match cart items against fetched products
  const lines = useMemo(() => {
    return items
      .map((item) => {
        const product = products.find((p) => p.id === item.id);
        if (!product) return null;
        return {
          ...product,
          qty: item.qty,
        };
      })
      .filter(Boolean) as (Product & { qty: number })[];
  }, [items, products]);

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.qty, 0),
    [lines]
  );

  const shipping = subtotal > 150 ? 0 : subtotal > 0 ? 12 : 0;
  const tax = Math.round(subtotal * 0.07 * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const goto = (n: number) => {
    setStep(n);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (!formData.email) throw new Error("Please enter your email address.");
      if (!formData.name) throw new Error("Please enter your full name.");
      if (!formData.address || !formData.city || !formData.state || !formData.zip) {
        throw new Error("Please complete all required shipping fields.");
      }
      if (lines.length === 0) throw new Error("Your cart is empty.");

      // Check stock
      for (const line of lines) {
        if (
          line.stock !== null &&
          line.stock !== undefined &&
          line.qty > line.stock
        ) {
          throw new Error(
            `${line.name} only has ${line.stock} item(s) available.`
          );
        }
      }

      const { data, error } = await supabase.functions.invoke(
        "create-btcpay-invoice",
        {
          body: {
            customer: formData,
            items: lines.map((line) => ({
              product_id: line.productId,
              variation_id: line.variationId,
              quantity: line.qty,
            })),
          },
        }
      );
      if (error) {
  console.error("BTCPay Edge Function error:", error);
  console.error("Error context:", error.context);

  if (error.context) {
    try {
      const response = error.context.clone();
      const responseText = await response.text();

      console.error(
        "BTCPay Edge Function response:",
        responseText,
      );
    } catch (readError) {
      console.error(
        "Could not read Edge Function response:",
        readError,
      );
    }
  }

  throw error;
}

      if (error) throw new Error(error.message);

      if (!data?.success || !data?.checkoutUrl) {
        throw new Error(
          data?.error || "BTCPay did not return a checkout URL."
        );
      }

      setOrderId(data.orderId);

      // Perform clean redirect to BTCPay invoice
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error("BTCPay checkout error:", err);
      setErrorMessage(
        err?.message || "Unable to create Bitcoin payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProducts) {
    return (
      <main className="min-h-screen bg-slate-50 pt-32">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-24">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading your cart...
          </div>
        </div>
      </main>
    );
  }

  if (placed) {
    return (
      <main className="relative min-h-screen bg-slate-50 pt-32 font-sans text-slate-800">
        <div className="mx-auto max-w-2xl px-6 pb-24 text-center md:px-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[rgb(93_138_111)]/30 bg-[rgb(93_138_111)]/10">
            <Check className="h-8 w-8 text-[rgb(93_138_111)]" />
          </div>

          <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
            Payment received.
          </h1>

          <p className="mt-4 text-sm text-slate-600">
            Thank you. Your order is being processed.
          </p>

          <div className="mt-10 rounded-3xl border border-slate-200/80 bg-white p-8 text-left shadow-sm">
            <div className="border-b border-slate-200/80 pb-6">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Order number
              </div>

              <div className="mt-1 text-3xl font-extrabold text-slate-900">
                #{orderId}
              </div>
            </div>

            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(93_138_111)] text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>

                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Bitcoin payment confirmed
                  </div>

                  <div className="mt-0.5 text-xs text-slate-500">
                    Payment received by BTCPay Server
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
                  <Package className="h-3.5 w-3.5" />
                </span>

                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Preparing your order
                  </div>

                  <div className="mt-0.5 text-xs text-slate-500">
                    Processing begins after payment confirmation
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <MagneticButton to="/shop" variant="blue">
              Keep shopping
            </MagneticButton>

            <MagneticButton to="/" variant="ghost">
              Back home
            </MagneticButton>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-slate-50 pt-28 font-sans text-slate-800">
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <span className="text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
          Checkout
        </span>

        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl">
          Complete your order
        </h1>

        <ol className="mt-8 flex items-center gap-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => i < step && goto(i)}
                className="flex items-center gap-2"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i < step
                    ? "bg-[rgb(93_138_111)] text-white"
                    : i === step
                      ? "bg-[rgb(43_90_143)] text-white"
                      : "border border-slate-200 bg-white text-slate-400"
                    }`}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>

                <span
                  className={`text-xs font-bold uppercase tracking-wider ${i === step ? "text-slate-900" : "text-slate-400"
                    }`}
                >
                  {s}
                </span>
              </button>

              {i < STEPS.length - 1 && (
                <span className="h-px flex-1 bg-slate-200" />
              )}
            </li>
          ))}
        </ol>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-8">
            {items.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <p className="text-3xl font-extrabold text-slate-900">
                  Your cart is empty
                </p>

                <div className="mt-6 flex justify-center">
                  <MagneticButton to="/shop" variant="blue">
                    Browse peptides
                  </MagneticButton>
                </div>
              </div>
            ) : step === 0 ? (
              <>
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                  <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Cart · {lines.length} item{lines.length > 1 ? "s" : ""}
                    </div>

                    <button
                      type="button"
                      onClick={clear}
                      className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900"
                    >
                      Clear all
                    </button>
                  </div>

                  <ul className="divide-y divide-slate-200/80">
                    {lines.map((l) => (
                      <li
                        key={l.id}
                        className="flex flex-wrap items-center gap-4 py-4"
                      >
                        <img
                          src={l.img ?? ""}
                          alt={l.name}
                          className="h-20 w-20 rounded-2xl border border-slate-200 object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[rgb(43_90_143)]">
                            {l.category}
                          </div>

                          <Link
                            to="/shop/$productId"
                            params={{ productId: l.productId }}
                            className="text-lg font-extrabold text-slate-900 hover:text-[rgb(43_90_143)]"
                          >
                            {l.name}
                          </Link>

                          <div className="text-xs text-slate-500">
                            ${l.price} each
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                          <button
                            type="button"
                            onClick={() => setQty(l.id, l.qty - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full"
                          >
                            <Minus className="h-3 w-3" />
                          </button>

                          <input
                            value={l.qty}
                            onChange={(e) => {
                              const v = parseInt(
                                e.target.value.replace(/\D/g, ""),
                                10
                              );

                              setQty(
                                l.id,
                                Number.isNaN(v) ? 0 : v
                              );
                            }}
                            className="w-9 bg-transparent text-center text-sm font-bold focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => setQty(l.id, l.qty + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="w-20 text-right text-lg font-extrabold text-slate-900">
                          ${(l.price * l.qty).toFixed(2)}
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(l.id)}
                          className="p-2 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>

                <div className="flex flex-wrap items-center gap-4">
                  <MagneticButton variant="blue" onClick={() => goto(1)}>
                    Continue to shipping
                  </MagneticButton>

                  <Link
                    to="/shop"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    ← Continue shopping
                  </Link>
                </div>
              </>
            ) : step === 1 ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  goto(2);
                }}
                className="flex flex-col gap-6"
              >
                <FormCard title="Contact">
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                  />

                  <Field
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </FormCard>

                <FormCard title="Shipping address">
                  <Field
                    label="Full name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                  />

                  <Field
                    label="Address"
                    name="address"
                    required
                    className="sm:col-span-2"
                    value={formData.address}
                    onChange={handleInputChange}
                  />

                  <Field
                    label="City"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                  />

                  <Field
                    label="State"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                  />

                  <Field
                    label="ZIP"
                    name="zip"
                    required
                    value={formData.zip}
                    onChange={handleInputChange}
                  />

                  <Field
                    label="Country"
                    name="country"
                    required
                    value={formData.country}
                    onChange={handleInputChange}
                  />
                </FormCard>

                <div className="flex flex-wrap items-center gap-4">
                  <MagneticButton variant="blue" type="submit">
                    Continue to Bitcoin
                  </MagneticButton>

                  <button
                    type="button"
                    onClick={() => goto(0)}
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    ← Back to cart
                  </button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={handleCreatePayment}
                className="flex flex-col gap-6"
              >
                <FormCard title="Bitcoin payment">
                  <div className="sm:col-span-2 rounded-2xl border border-orange-200 bg-orange-50 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-white">
                        <Bitcoin className="h-6 w-6" />
                      </div>

                      <div>
                        <div className="font-extrabold text-slate-900">
                          Pay with Bitcoin
                        </div>

                        <div className="text-xs text-slate-500">
                          Secure checkout powered by BTCPay Server
                        </div>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-relaxed text-slate-600">
                      Click the button below to continue to the secure BTCPay
                      payment page. Your Bitcoin invoice will be generated for the
                      exact order total.
                    </p>
                  </div>
                </FormCard>

                <MagneticButton
                  variant="green"
                  type="submit"
                  disabled={loading}
                >
                  <span className="inline-flex items-center gap-2">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bitcoin className="h-4 w-4" />
                    )}

                    {loading
                      ? "Creating Bitcoin invoice..."
                      : `Pay with Bitcoin · $${total.toFixed(2)}`}
                  </span>
                </MagneticButton>

                <button
                  type="button"
                  onClick={() => goto(1)}
                  className="self-start text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  ← Back to shipping
                </button>
              </form>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Order summary
              </div>

              <ul className="mt-6 space-y-3">
                {lines.map((l) => (
                  <li
                    key={l.id}
                    className="flex justify-between text-xs font-medium text-slate-600"
                  >
                    <span>
                      {l.name} × {l.qty}
                    </span>

                    <span className="font-bold text-slate-900">
                      ${(l.price * l.qty).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-6 space-y-3 border-t border-slate-200 pt-6 text-sm">
                <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />

                <Row
                  label="Shipping"
                  value={
                    shipping === 0 && subtotal > 0
                      ? "Free"
                      : `$${shipping.toFixed(2)}`
                  }
                />

                <Row label="Tax" value={`$${tax.toFixed(2)}`} />
              </dl>

              <div className="mt-6 flex items-baseline justify-between border-t border-slate-200 pt-6">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total
                </div>

                <div className="text-4xl font-extrabold text-[rgb(43_90_143)]">
                  ${total.toFixed(2)}
                </div>
              </div>

              <ul className="mt-8 space-y-3 text-xs font-medium text-slate-500">
                <li className="flex items-center gap-2.5">
                  <Lock className="h-4 w-4 text-[rgb(43_90_143)]" />
                  Secure BTCPay checkout
                </li>

                <li className="flex items-center gap-2.5">
                  <Bitcoin className="h-4 w-4 text-orange-500" />
                  Bitcoin / Lightning supported by BTCPay
                </li>

                <li className="flex items-center gap-2.5">
                  <Truck className="h-4 w-4 text-[rgb(93_138_111)]" />
                  Free shipping over $150
                </li>

                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-slate-700" />
                  Payment verified server-side
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="py-16" />
      </div>
    </main>
  );
}

function FormCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8">
      <div className="mb-6 text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
        {title}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>

      <input
        {...rest}
        value={value ?? ""}
        onChange={onChange}
        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-[rgb(43_90_143)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[rgb(43_90_143)]"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-base font-extrabold text-slate-900">{value}</dd>
    </div>
  );
}