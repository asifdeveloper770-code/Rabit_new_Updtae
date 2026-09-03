import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, Menu, X } from "lucide-react";
import mark from "@/assets/jacked-rabbits-mark.png";
import name from "@/assets/name.png";
import { useCart } from "@/lib/cart";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/science", label: "Science" },
  { to: "/contact", label: "Contact" },
] as const;

export function NavBar({ transparent = false }: { transparent?: boolean }) {
  const { count } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Trigger brief bounce/scale animation when item count increases
  useEffect(() => {
    if (count <= 0) return;
    setAnimateCart(true);
    const timer = setTimeout(() => setAnimateCart(false), 300);
    return () => clearTimeout(timer);
  }, [count]);

  const solid = !transparent || scrolled;

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid
          ? "border-b border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
      style={{
        paddingLeft: "max(env(safe-area-inset-left), 0px)",
        paddingRight: "max(env(safe-area-inset-right), 0px)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8 md:px-12">
        {/* Brand Logo */}
        <Link to="/" className="group flex min-w-0 items-center gap-3">
          <img
            src={mark}
            alt="Jacked Rabbits Logo"
            width={44}
            height={44}
            className="h-9 w-9 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <img
            src={name}
            alt="Jacked Rabbits Wordmark"
            width={44}
            height={50}
            className="h-10 w-28 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-8 font-sans text-xs font-semibold uppercase tracking-wider md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="relative py-1 text-slate-600 transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:scale-x-0 after:bg-slate-900 after:transition-transform hover:text-slate-900 hover:after:scale-x-100"
              activeProps={{
                className: "text-slate-900 after:scale-x-100 font-bold",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions (Cart & Mobile Toggle) */}
        <div className="flex items-center gap-3">
          <Link
            to="/checkout"
            data-magnetic
            className="relative inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-4 font-sans text-xs font-semibold uppercase tracking-wider text-slate-800 transition-all duration-200 hover:border-[rgb(43_90_143)] hover:bg-[rgb(43_90_143)]/10 hover:text-[rgb(43_90_143)]"
          >
            <ShoppingBag className="h-4 w-4 stroke-[2.25]" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span
                className={`ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgb(93_138_111)] px-1.5 text-[11px] font-bold text-white transition-transform duration-300 ${
                  animateCart ? "scale-125" : "scale-100"
                }`}
                style={{ boxShadow: "0 2px 8px rgb(93 138 111 / 0.4)" }}
              >
                {count}
              </span>
            )}
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-800 transition-colors hover:bg-slate-100 md:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-t border-slate-200/80 bg-white/95 shadow-lg backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                className="rounded-xl px-4 py-3 font-sans text-xs font-semibold uppercase tracking-wider text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                activeProps={{
                  className: "text-slate-900 bg-slate-100 font-bold",
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}