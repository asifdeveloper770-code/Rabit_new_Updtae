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

const STATUS_OPTIONS: Order["order_status"][] = ["pending", "processing", "fulfilled", "cancelled"];

function AdminOrdersDashboard() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
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
          price,
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

  const handleStatusChange = async (orderId: string, newStatus: Order["order_status"]) => {
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
      if (o.order_status !== "cancelled") {
        totalRevenue += Number(o.total || 0);
        o.order_items?.forEach((item) => {
          totalUnitsSold += item.quantity || 0;
        });
      }
      if (o.order_status === "pending") pendingCount++;
    });

    return { totalRevenue, totalUnitsSold, pendingCount, totalOrders: orders.length };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = selectedStatus === "All" || o.order_status === selectedStatus;
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
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${selectedStatus === status
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
                  const isSelected = selectedOrderId === order.id;
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
                        ${Number(order.total ?? 0).toFixed(2)}
                      </td>

                      <td className="p-4">
                        <select
                          disabled={updatingId === order.id}
                          value={order.order_status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as Order["order_status"])}
                          className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border-none focus:ring-2 focus:ring-[rgb(43_90_143)] ${order.order_status === "fulfilled"
                            ? "bg-emerald-50 text-emerald-600"
                            : order.order_status === "processing"
                              ? "bg-blue-50 text-blue-600"
                              : order.order_status === "cancelled"
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
                          onClick={() => setSelectedOrderId(order.id)}
                          className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          View Items
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
      {/* Order Items Modal */}
      {selectedOrderId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedOrderId(null)}
        >
          {(() => {
            const current = orders.find((o) => o.id === selectedOrderId);

            if (!current) return null;

            return (
              <div
                className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(43_90_143)]">
                      Order Items
                    </span>

                    <h3 className="mt-1 font-mono text-base font-bold text-slate-900">
                      {current.id}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {current.customer_email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>

                {/* Modal Body */}
                <div className="max-h-[calc(90vh-90px)] overflow-y-auto p-6">
                  {current.order_items?.length ? (
                    <div className="space-y-3">
                      {current.order_items.map((item) => {
                        const quantity = Number(item.quantity ?? 0);
                        const price = Number(item.price ?? 0);
                        const lineTotal = price * quantity;

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex min-w-0 items-center gap-4">
                              <img
                                src={item.products?.img || "/vial.jpg"}
                                alt={item.products?.name || "Compound"}
                                className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-white object-cover"
                              />

                              <div className="min-w-0">
                                <div className="truncate text-sm font-bold text-slate-900">
                                  {item.products?.name || "Unknown Item"}
                                </div>

                                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[rgb(43_90_143)]">
                                  {item.products?.category || "Research Grade"}
                                </div>

                                {item.products?.tag && (
                                  <div className="mt-1 text-[10px] text-slate-400">
                                    {item.products.tag}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="text-sm font-black text-slate-900">
                                ${lineTotal.toFixed(2)}
                              </div>

                              <div className="mt-1 text-[10px] font-semibold text-slate-400">
                                {quantity} × ${price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm font-medium text-slate-400">
                      No items found for this order.
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-semibold text-slate-900">
                          ${Number(current.subtotal ?? 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">Shipping</span>
                        <span className="font-semibold text-slate-900">
                          ${Number(current.shipping ?? 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">Tax</span>
                        <span className="font-semibold text-slate-900">
                          ${Number(current.tax ?? 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-3 flex justify-between border-t border-slate-100 pt-3">
                        <span className="font-bold text-slate-900">
                          Total
                        </span>

                        <span className="font-black text-[rgb(43_90_143)]">
                          ${Number(current.total ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Delivery Address
                    </h4>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-slate-900">
                        {current.shipping_address?.name || current.full_name || "N/A"}
                      </p>

                      <p className="text-slate-600">
                        {current.shipping_address?.street || current.address || "N/A"}
                      </p>

                      <p className="text-slate-600">
                        {current.shipping_address?.city || current.city},{" "}
                        {current.shipping_address?.state || current.state}{" "}
                        {current.shipping_address?.zip || current.zip}
                      </p>

                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          Contact
                        </span>

                        <p className="font-semibold text-[rgb(43_90_143)]">
                          {current.customer_email}
                        </p>

                        {current.phone && (
                          <p className="mt-1 text-slate-600">
                            {current.phone}
                          </p>
                        )}
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