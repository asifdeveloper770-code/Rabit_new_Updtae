import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase, Product } from "@/lib/supabase";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { count: activeCartCount, items: cartItems } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const { data } = await supabase.from("products").select("*");
      if (data) setProducts(data);
      setLoading(false);
    }
    loadStats();
  }, []);

  const totalRevenue = products.reduce((acc, p) => acc + p.price * (p.stock || 10), 0);
  const totalInjectables = products.filter((p) => p.category === "Injectables").length;
  const totalPeptides = products.filter((p) => p.category === "Peptides").length;

  return (
    <div className="space-y-8">
      <div>
        <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
          Real-Time Metrics
        </span>
        <h1 className="mt-1 font-sans text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          System Overview
        </h1>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Inventory Value
          </div>
          <div className="mt-2 font-sans text-3xl font-black tracking-tight text-slate-900">
            ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Active Cart Items
          </div>
          <div className="mt-2 font-sans text-3xl font-black tracking-tight text-[rgb(43_90_143)]">
            {activeCartCount}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Peptides in Stock
          </div>
          <div className="mt-2 font-sans text-3xl font-black tracking-tight text-slate-900">
            {totalPeptides}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="font-sans text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Injectables Listed
          </div>
          <div className="mt-2 font-sans text-3xl font-black tracking-tight text-slate-900">
            {totalInjectables}
          </div>
        </div>
      </div>

      {/* Active Session Cart Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="font-sans text-lg font-bold text-slate-900">Active Session Staging Cart</h2>
        <p className="mt-1 text-xs text-slate-500">Items currently held in client-side local cart store</p>
        
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-slate-200 uppercase tracking-wider text-slate-400">
                <th className="pb-3 font-semibold">Product ID</th>
                <th className="pb-3 font-semibold">Quantity</th>
                <th className="pb-3 font-semibold">Session Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {cartItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-400">
                    No active cart items in present session.
                  </td>
                </tr>
              ) : (
                cartItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-4 font-bold text-slate-900">{item.id}</td>
                    <td className="py-4 font-semibold text-[rgb(43_90_143)]">{item.qty} units</td>
                    <td className="py-4">
                      <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                        Pending Checkout
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}