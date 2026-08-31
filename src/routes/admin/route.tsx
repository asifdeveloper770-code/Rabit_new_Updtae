import { useState, useEffect } from "react";
import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isLoginPage = location.pathname === "/admin/login";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (!currentUser && !isLoginPage) {
        navigate({ to: "/admin/login" });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser && !isLoginPage) {
        navigate({ to: "/admin/login" });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isLoginPage]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans text-xs font-bold uppercase tracking-wider text-slate-400">
        Authenticating session...
      </div>
    );
  }

  // Render full screen view (no sidebar) if user is not logged in or on login page
  if (!user || isLoginPage) {
    return <Outlet />;
  }

  // Render Dashboard shell with Sidebar only when authenticated
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200/80 bg-white p-6">
        <div className="mb-8">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[rgb(43_90_143)]">
            Admin Console
          </span>
          <h2 className="text-xl font-black text-slate-900">Jacked Rabbits</h2>
        </div>

        <nav className="space-y-1">
          <Link
            to="/admin"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-slate-100 font-bold text-[rgb(43_90_143)]" }}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <span>Overview</span>
          </Link>
          <Link
            to="/admin/products"
            activeProps={{ className: "bg-slate-100 font-bold text-[rgb(43_90_143)]" }}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <span>Products</span>
          </Link>
          <Link
            to="/admin/orders"
            activeProps={{ className: "bg-slate-100 font-bold text-[rgb(43_90_143)]" }}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <span>Orders</span>
          </Link>
          <Link
            to="/admin/order-items"
            activeProps={{ className: "bg-slate-100 font-bold text-[rgb(43_90_143)]" }}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <span>Order Items</span>
          </Link>
          <Link
            to="/admin/payment-settings"
            activeProps={{ className: "bg-slate-100 font-bold text-[rgb(43_90_143)]" }}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <span>Payment Gateway</span>
          </Link>
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-10">
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-500 transition-colors hover:text-red-700"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto p-8 md:p-12">
        <Outlet />
      </main>
    </div>
  );
}
