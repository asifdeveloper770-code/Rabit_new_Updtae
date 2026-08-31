import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase, Order, OrderItem, Product } from "@/lib/supabase";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersDashboard,
});

type DetailedOrderItem = OrderItem & {
  products: Pick<Product, "name" | "category" | "img" | "tag"> | null;
};

type OrderWithItems = Order & {
  order_items: DetailedOrderItem[];
};

const STATUS_OPTIONS: Order["status"][] = ["Pending", "Processing", "Fulfilled", "Cancelled"];

function AdminOrdersDashboard() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
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
            img,
            tag
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as OrderWithItems[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    }
    setUpdatingId(null);
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalUnitsSold = 0;
    let pendingCount = 0;

    orders.forEach((o) => {
      if (o.status !== "Cancelled") {
        totalRevenue += Number(o.total_amount || 0);
        o.order_items?.forEach((item) => {
          totalUnitsSold += item.quantity || 0;
        });
      }
      if (o.status === "Pending") pendingCount++;
    });

    return { totalRevenue, totalUnitsSold, pendingCount, totalOrders: orders.length };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = selectedStatus === "All" || o.status === selectedStatus;
      const matchesSearch =
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.shipping_address?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.order_items?.some((item) =>
          item.products?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchQuery]);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
            Fulfillment & Inventory Console
          </span>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Orders & Line Items
          </h1>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Revenue
          </span>
          <div className="mt-1 text-2xl font-black text-[rgb(43_90_143)]">
            ${metrics.totalRevenue.toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Units Dispatched
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {metrics.totalUnitsSold} Units
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Pending Orders
          </span>
          <div className="mt-1 text-2xl font-black text-amber-600">
            {metrics.pendingCount}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Orders
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {metrics.totalOrders}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, Email, Customer, or Compound Name..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-900 transition-colors focus:border-[rgb(43_90_143)] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {["All", ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                selectedStatus === status
                  ? "bg-[rgb(43_90_143)] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 uppercase tracking-wider text-slate-400">
                <th className="p-4 font-semibold">Order Ref</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Line Items</th>
                <th className="p-4 font-semibold">Total Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-bold uppercase tracking-wider text-slate-400">
                    Fetching records...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const itemSummary = order.order_items
                    ?.map((i) => `${i.quantity}x ${i.products?.name || "Item"}`)
                    .join(", ");

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        <div className="font-mono text-slate-900">{order.id}</div>
                        <div className="text-[10px] font-semibold text-slate-400">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A"}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-900">{order.shipping_address?.name || "N/A"}</div>
                        <div className="text-slate-500">{order.customer_email}</div>
                      </td>

                      <td className="p-4 max-w-xs truncate text-slate-600 font-medium">
                        {itemSummary || "No items"}
                      </td>

                      <td className="p-4 font-black text-slate-900">
                        ${order.total_amount.toFixed(2)}
                      </td>

                      <td className="p-4">
                        <select
                          disabled={updatingId === order.id}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as Order["status"])}
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border-none focus:ring-2 focus:ring-[rgb(43_90_143)] ${
                            order.status === "Fulfilled"
                              ? "bg-emerald-50 text-emerald-600"
                              : order.status === "Processing"
                              ? "bg-blue-50 text-blue-600"
                              : order.status === "Cancelled"
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          {isExpanded ? "Hide Details" : "View Items"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expandable Order & Items Breakdown Panel */}
      {expandedOrderId && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          {(() => {
            const current = orders.find((o) => o.id === expandedOrderId);
            if (!current) return null;
            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(43_90_143)]">
                      Order Line Items Breakdown
                    </span>
                    <h3 className="font-mono text-base font-bold text-slate-900">{current.id}</h3>
                  </div>
                  <button
                    onClick={() => setExpandedOrderId(null)}
                    className="text-xs font-bold uppercase text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Itemized Table */}
                  <div className="lg:col-span-2">
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Compounds in Order
                    </h4>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                      {current.order_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.products?.img || "/vial.jpg"}
                              alt={item.products?.name || "Compound"}
                              className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {item.products?.name || "Unknown Item"}
                              </div>
                              <div className="text-[10px] font-semibold text-[rgb(43_90_143)]">
                                {item.products?.category || "Research Grade"}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-900">
                              ${(item.unit_price * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400">
                              {item.quantity} × ${item.unit_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Info Card */}
                  <div>
                    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Delivery Address
                    </h4>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs space-y-1">
                      <p className="font-bold text-slate-900">{current.shipping_address?.name}</p>
                      <p className="text-slate-600">{current.shipping_address?.street}</p>
                      <p className="text-slate-600">
                        {current.shipping_address?.city}, {current.shipping_address?.state}{" "}
                        {current.shipping_address?.zip}
                      </p>
                      <div className="pt-2 border-t border-slate-200/60 mt-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Contact</span>
                        <p className="font-semibold text-[rgb(43_90_143)]">{current.customer_email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}