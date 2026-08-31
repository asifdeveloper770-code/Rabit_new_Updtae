import { useState, useEffect } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { supabase, Order, OrderItem, Product } from "@/lib/supabase";

export const Route = createFileRoute("/order-confirmation")({
  component: OrderConfirmationPage,
});

type DetailedOrderItem = OrderItem & {
  products: Pick<Product, "name" | "category" | "tag" | "img"> | null;
};

type OrderDetail = Order & {
  order_items: DetailedOrderItem[];
};

function OrderConfirmationPage() {
  const search = useSearch({ from: "/order-confirmation" }) as { orderId?: string };
  const orderId = search.orderId;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!orderId) {
        setError("No order identifier provided.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Query order and join child order_items with product details
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            products (
              name,
              category,
              tag,
              img
            )
          )
        `)
        .eq("id", orderId)
        .single();

      if (fetchError || !data) {
        setError("Could not locate order details.");
      } else {
        setOrder(data as OrderDetail);
      }
      setLoading(false);
    }

    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-sans text-xs font-bold uppercase tracking-wider text-slate-400">
        Fetching order receipt...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-md py-20 text-center font-sans">
        <span className="text-xs font-bold uppercase tracking-widest text-red-500">
          Receipt Error
        </span>
        <h1 className="mt-2 text-2xl font-black text-slate-900">
          {error || "Order Not Found"}
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          Please check your email receipt or contact customer support if you believe this is a mistake.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const { shipping_address } = order;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 font-sans text-slate-800 antialiased selection:bg-[rgb(43_90_143)]/10 selection:text-[rgb(43_90_143)]">
      {/* Header Badge */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
          Order Confirmed
        </span>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          Dispatch Staged
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          Order reference: <span className="font-mono font-bold text-slate-900">{order.id}</span>
        </p>
      </div>

      {/* Main Receipt Container */}
      <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 text-xs">
          <div>
            <span className="font-semibold uppercase tracking-wider text-slate-400">Fulfillment Status</span>
            <div className="mt-0.5">
              <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
                {order.status}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-semibold uppercase tracking-wider text-slate-400">Placed On</span>
            <div className="mt-0.5 font-bold text-slate-900">
              {order.created_at ? new Date(order.created_at).toLocaleDateString() : "Just now"}
            </div>
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Compound Items
          </h2>

          <ul className="mt-4 divide-y divide-slate-100">
            {order.order_items.map((item) => (
              <li key={item.id || item.product_id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100">
                    <img
                      src={item.products?.img || "/vial.jpg"}
                      alt={item.products?.name || "Compound"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[rgb(43_90_143)]">
                      {item.products?.category || "Research Grade"}
                    </div>
                    <div className="font-bold text-slate-900">
                      {item.products?.name || item.product_id}
                    </div>
                    <div className="text-xs text-slate-400">
                      {item.products?.tag || `Qty: ${item.quantity}`}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-slate-900">
                    ${(item.unit_price * item.quantity).toFixed(2)}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400">
                    {item.quantity} × ${item.unit_price.toFixed(2)}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Pricing Breakdown */}
          <div className="mt-6 border-t border-slate-200/80 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Cold-Chain Shipping</span>
              <span className="font-bold text-slate-900">Complimentary</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Batch Testing & COA Verification</span>
              <span className="font-bold text-slate-900">Included</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-black text-slate-900">
              <span>Total Charged</span>
              <span className="text-lg text-[rgb(43_90_143)]">
                ${order.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping & Contact Info Footer */}
        <div className="grid grid-cols-1 gap-6 border-t border-slate-200/80 bg-slate-50/50 p-6 md:grid-cols-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Customer Account
            </span>
            <p className="mt-1 text-xs font-bold text-slate-900">{order.customer_email}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Destination Address
            </span>
            <p className="mt-1 text-xs font-medium leading-relaxed text-slate-700">
              <strong className="block text-slate-900">{shipping_address.name}</strong>
              {shipping_address.street}<br />
              {shipping_address.city}, {shipping_address.state} {shipping_address.zip}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          to="/"
          className="rounded-xl bg-[rgb(43_90_143)] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-opacity hover:opacity-95"
        >
          Return to Catalogue
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 transition-colors hover:bg-slate-50"
        >
          Print Receipt
        </button>
      </div>
    </div>
  );
}