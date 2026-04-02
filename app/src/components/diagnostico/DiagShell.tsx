"use client";
import { useDiagAuth } from "@/lib/diagnostico-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface DiagShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: string;
  showBack?: boolean;
  actions?: ReactNode;
}

const NAV_ITEMS: { href: string; icon: string; label: string; adminOnly: boolean; external?: boolean }[] = [
  { href: "/diagnostico/dashboard", icon: "space_dashboard", label: "Início", adminOnly: false },
  { href: "/diagnostico/bi", icon: "monitoring", label: "BI", adminOnly: true },
  { href: "/diagnostico/usuarios", icon: "group", label: "Usuários", adminOnly: true },
];

export default function DiagShell({ children, title, subtitle, icon, showBack, actions }: DiagShellProps) {
  const { user, isAdmin, logout } = useDiagAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) router.push("/diagnostico");
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-24 bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06]" style={{ background: "rgba(0, 0, 0, 0.92)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center justify-between px-5 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            {showBack && (
              <button onClick={() => router.push("/diagnostico/dashboard")} className="p-1 -ml-1 transition-colors text-slate-400 hover:text-white">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
              </button>
            )}
            {icon && (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06]">
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#ec1313" }}>{icon}</span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-white truncate">{title}</h1>
              {subtitle && <p className="text-[11px] truncate text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <div className="flex items-center gap-2 pl-2 ml-2 border-l border-white/[0.06]">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-white">{user.nome}</p>
                <p className="text-[10px] text-slate-500">{user.role === "admin" ? "Administrador" : "Consultor"}</p>
              </div>
              <button
                onClick={() => { logout(); router.push("/diagnostico"); }}
                className="p-2 rounded-lg transition-all hover:bg-white/[0.05] text-slate-500 hover:text-white"
                title="Sair"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-5 py-6">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06]" style={{ background: "rgba(0, 0, 0, 0.95)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-6xl mx-auto flex">
          {NAV_ITEMS.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive = pathname === item.href || (item.href !== "/diagnostico/dashboard" && pathname.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => item.external ? (window.location.href = item.href) : router.push(item.href)}
                className="flex-1 flex flex-col items-center gap-1 py-3 transition-all"
                style={{ color: isActive ? "#ec1313" : "#64748b" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
                {isActive && <div className="w-5 h-0.5 rounded-full bg-[#ec1313]" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
