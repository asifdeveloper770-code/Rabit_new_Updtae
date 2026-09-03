import { Link } from "@tanstack/react-router";
import mark from "@/assets/jacked-rabbits-mark.png";
import name from "@/assets/name.png";

export function Footer() {
  return (
    <footer
      id="contact"
      className="relative border-t border-slate-200/80 bg-white font-sans text-slate-800 antialiased selection:bg-[rgb(43_90_143)]/10 selection:text-[rgb(43_90_143)]"
    >
      <div className="mx-auto max-w-7xl px-6 py-14 text-center sm:py-20 sm:text-left md:px-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-5">
          {/* Logo */}
          <div className="flex flex-col items-center sm:col-span-2 sm:items-start">
            <Link to="/" className="flex items-center gap-4">
              <img
                src={mark}
                width={80}
                height={80}
                alt="Jacked Rabbits"
                className="h-16 w-16 object-contain"
              />

              <img
                src={name}
                alt="Jacked Rabbits Wordmark"
                width={44}
                height={50}
                className="h-10 w-28 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>
          </div>

          {[
            {
              t: "Shop",
              i: [
                { label: "All Peptides", to: "/shop" },
                { label: "Recovery", to: "/shop?cat=Recovery" },
                { label: "Growth", to: "/shop?cat=Growth" },
                { label: "Metabolic", to: "/shop?cat=Metabolic" },
              ],
            },
            {
              t: "Learn",
              i: [
                { label: "Science", to: "/science" },
                { label: "Lab Reports", to: "/science" },
              ],
            },
            {
              t: "Company",
              i: [
                { label: "Contact", to: "/contact" },
                { label: "Home", to: "/" },
              ],
            },
          ].map((col) => (
            <div key={col.t}>
              <div className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {col.t}
              </div>

              <ul className="mt-4 space-y-3 font-sans text-sm font-medium">
                {col.i.map((x) => (
                  <li key={x.label}>
                    <Link
                      to={x.to}
                      className="text-slate-600 transition-colors hover:text-[rgb(43_90_143)]"
                    >
                      {x.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 sm:flex-row">
          <div className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">
            © {new Date().getFullYear()} Jacked Rabbits Laboratories
          </div>

          <div className="flex gap-6 font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Link
              to="/contact"
              className="transition-colors hover:text-slate-900"
            >
              Privacy
            </Link>

            <Link
              to="/contact"
              className="transition-colors hover:text-slate-900"
            >
              Terms
            </Link>

            <Link
              to="/contact"
              className="transition-colors hover:text-slate-900"
            >
              Shipping
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}