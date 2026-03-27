"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDiagAuth } from "@/lib/diagnostico-context";

export default function BiPage() {
  const router = useRouter();
  const { user, isAdmin } = useDiagAuth();

  useEffect(() => {
    if (!user) {
      router.push("/diagnostico");
    } else if (!isAdmin) {
      router.push("/diagnostico/dashboard");
    }
  }, [user, isAdmin, router]);

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b border-white/[0.06]"
        style={{ background: "rgba(0, 0, 0, 0.92)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/diagnostico/dashboard")}
              className="p-1 -ml-1 transition-colors text-slate-400 hover:text-white"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
            </button>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06]">
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#ec1313" }}>monitoring</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-white truncate">Diagn&oacute;stico Comercial</h1>
              <p className="text-[11px] truncate text-slate-500">Business Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pl-2 ml-2 border-l border-white/[0.06]">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-white">{user.nome}</p>
                <p className="text-[10px] text-slate-500">Administrador</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* BI iframe — full remaining height */}
      <div className="flex-1">
        <iframe
          src="/diagnostico/form/bi-preview.html"
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 73px)" }}
          title="BI Dashboard"
        />
      </div>
    </div>
  );
}
