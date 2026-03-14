"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  icon: string;
  label: string;
  href: string;
}

const adminNav: NavItem[] = [
  { icon: "dashboard", label: "Painel", href: "/dashboard" },
  { icon: "badge", label: "Vendedores", href: "/vendedores" },
  { icon: "handshake", label: "Parceiros", href: "/parceiros" },
  { icon: "assignment", label: "Indicações", href: "/indicacoes" },
  { icon: "swap_horiz", label: "Transferir", href: "/portabilidade" },
];

const vendedorNav: NavItem[] = [
  { icon: "dashboard", label: "Painel", href: "/dashboard" },
  { icon: "handshake", label: "Parceiros", href: "/parceiros" },
  { icon: "assignment", label: "Indicações", href: "/indicacoes" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const items = isAdmin ? adminNav : vendedorNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 pb-8 pt-3 z-50">
      <div className="max-w-2xl mx-auto flex justify-around items-center">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? "text-[#ec1313]" : "text-slate-500 hover:text-white"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22 }}
              >
                {item.icon}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
