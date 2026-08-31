import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase, OrderItem, Product } from "@/lib/supabase";

export const Route = createFileRoute("/admin/order-items")({
  component: OrderItemsDashboard,
});

type JoinedOrderItem = OrderItem & {
  orders: {
    id: string;
    customer_email: string;
    status: string;
    created_at: string;
  } | null;
  products: Pick<Product, "name" | "category" | "img" | "tag"> | null;
};

type ProductSalesSummary = {
  productId: string;
  name: string;
  category: string;
  img: string;
  unitsSold: number;
  totalRevenue: number;
};

function OrderItemsDashboard() {
  const [items, setItems] = useState<JoinedOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const fetchOrderItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        *,
        orders (
          id,
          customer_email,
          status,
          created_at
        ),
        products (
          name,
          category,
          img,
          tag
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data as JoinedOrderItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrderItems();
  }, []);

  // Aggregated Sales Data per Product
  const productSummaries = useMemo(() => {
    const summaryMap: Record<string, ProductSalesSummary> = {};

    items.forEach((item) => {
      // Exclude cancelled order quantities from revenue summary
      if (item.orders?.status === "Cancelled") return;

      const pid = item.product_id;
      const productName = item.products?.name || pid;
      const category = item.products?.category || "Uncategorized";
      const img = item.products?.img || "/vial.jpg";
      const revenue = (item.quantity || 0) * (item.price || 0);

      if (!summaryMap[pid]) {
        summaryMap[pid] = {
          productId: pid,
          name: productName,
          category,
          img,
          unitsSold: 0,
          totalRevenue: 0,
        };
      }

      summaryMap[pid].unitsSold += item.quantity || 0;
      summaryMap[pid].totalRevenue += revenue;
    });

    return Object.values(summaryMap).sort((a, b) => b.unitsSold - a.unitsSold);
  }, [items]);

  // Overall Item Metrics
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let totalRevenue = 0;

    items.forEach((item) => {
      if (item.orders?.status !== "Cancelled") {
        totalUnits += item.quantity || 0;
        totalRevenue += (item.quantity || 0) * (item.price || 0);
      }
    });

    return { totalUnits, totalRevenue, totalUniqueProducts: productSummaries.length };
  }, [items, productSummaries]);

  // Filtered Item Transactions Table
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.products?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.orders?.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.order_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || item.products?.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
            Product Movement & Sales Analytics
          </span>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Order Items Intelligence
          </h1>
        </div>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Units Sold
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {metrics.totalUnits} Units
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Item-Level Revenue
          </span>
          <div className="mt-1 text-2xl font-black text-[rgb(43_90_143)]">
            ${metrics.totalRevenue.toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Active SKUs Ordered
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {metrics.totalUniqueProducts} Compounds
          </div>
        </div>
      </div>

      {/* Top Performing Compounds Cards */}
      <div>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
          Top Moving Compounds
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {productSummaries.slice(0, 4).map((p) => (
            <div
              key={p.productId}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
            >
              <img
                src={p.img}
                alt={p.name}
                className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold uppercase text-[rgb(43_90_143)]">
                  {p.category}
                </span>
                <h3 className="truncate text-xs font-bold text-slate-900">{p.name}</h3>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">{p.unitsSold} sold</span>
                  <span className="font-extrabold text-slate-900">${p.totalRevenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Compound Name, Customer Email, or Order ID..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-900 transition-colors focus:border-[rgb(43_90_143)] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {["All", "Injectables", "Oral", "Peptides"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                selectedCategory === cat
                  ? "bg-[rgb(43_90_143)] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Order Items Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 uppercase tracking-wider text-slate-400">
                <th className="p-4 font-semibold">Item & Category</th>
                <th className="p-4 font-semibold">Order Reference</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Quantity</th>
                <th className="p-4 font-semibold">Unit Price</th>
                <th className="p-4 font-semibold">Line Total</th>
                <th className="p-4 font-semibold text-right">Order Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center font-bold uppercase tracking-wider text-slate-400">
                    Loading Order Items...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No order items match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const lineTotal = (item.quantity || 0) * (item.price || 0);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.products?.img || "/vial.jpg"}
                            alt={item.products?.name || "Product"}
                            className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                          />
                          <div>
                            <div className="font-bold text-slate-900">
                              {item.products?.name || item.product_id}
                            </div>
                            <div className="text-[10px] font-semibold text-[rgb(43_90_143)]">
                              {item.products?.category || "Research Grade"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-slate-900">
                        {item.order_id}
                      </td>

                      <td className="p-4 text-slate-600">
                        {item.orders?.customer_email || "Anonymous"}
                      </td>

                      <td className="p-4 font-extrabold text-slate-900">
                        {item.quantity}
                      </td>

                      <td className="p-4 text-slate-600">
                        ${item.price.toFixed(2)}
                      </td>

                      <td className="p-4 font-black text-slate-900">
                        ${lineTotal.toFixed(2)}
                      </td>

                      <td className="p-4 text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            item.orders?.status === "Fulfilled"
                              ? "bg-emerald-50 text-emerald-600"
                              : item.orders?.status === "Processing"
                              ? "bg-blue-50 text-blue-600"
                              : item.orders?.status === "Cancelled"
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {item.orders?.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}