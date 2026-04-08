"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clsx } from "clsx";

const links = [
  { href: "/dashboard", label: "Campanhas", icon: LayoutDashboard },
  { href: "/executivos", label: "Executivos", icon: Users },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="fixed left-0 top-0 h-full w-56 bg-[#0D0D0D] border-r border-[rgba(255,255,255,0.06)] flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-[rgba(255,255,255,0.06)]">
        <div className="w-8 h-0.5 bg-gold mb-3" />
        <span className="font-serif text-base font-bold text-white leading-tight">
          Campaign<br />Studio
        </span>
        <span className="block text-[10px] text-white/30 tracking-widest uppercase mt-1">
          DWV Parcerias
        </span>
      </div>

      {/* Links */}
      <div className="flex-1 py-4 space-y-0.5 px-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-semibold transition-colors",
              pathname.startsWith(href)
                ? "bg-gold/10 text-gold"
                : "text-white/40 hover:text-white/80 hover:bg-white/4"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-sm text-sm font-semibold text-white/30 hover:text-white/60 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </nav>
  );
}
