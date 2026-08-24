"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./ui";

const ABAS = [
  { href: "/visitas", icone: "map", label: "Mapa" },
  { href: "/visitas/agenda", icone: "calendar_month", label: "Agenda" },
  { href: "/visitas/feed", icone: "format_list_bulleted", label: "Feed" },
  { href: "/visitas/relatorio", icone: "insights", label: "Relatório" },
];

export default function NavInferior({ badgeAgenda }: { badgeAgenda?: number }) {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[960] bg-[#0a0a0a]/97 backdrop-blur-md border-t border-[#1e1e1e]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-lg mx-auto grid grid-cols-4">
        {ABAS.map((a) => {
          const ativo = path === a.href;
          return (
            <Link
              key={a.href}
              href={a.href}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold uppercase tracking-wide transition ${
                ativo ? "text-[#ec1313]" : "text-[#6a6a6a] hover:text-[#a0a0a0]"
              }`}
            >
              <span className="relative">
                <Icon name={a.icone} size={22} />
                {a.href === "/visitas/agenda" && !!badgeAgenda && badgeAgenda > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-[#ec1313] text-white text-[9px] font-bold flex items-center justify-center">
                    {badgeAgenda > 9 ? "9+" : badgeAgenda}
                  </span>
                )}
              </span>
              {a.label}
              {ativo && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#ec1313]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
