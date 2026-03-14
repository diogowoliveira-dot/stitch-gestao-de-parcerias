"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDiagAuth } from "@/lib/diagnostico-context";

export default function DiagnosticoLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useDiagAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    if (login(email, senha)) {
      router.push("/diagnostico/dashboard");
    } else {
      setErro("E-mail ou senha inválidos");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #ec1313 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 -right-20 w-96 h-96 rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #ec1313 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 bg-[#ec1313]" style={{ boxShadow: "0 8px 32px rgba(236, 19, 19, 0.3)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Diagnóstico Comercial
          </h1>
          <p className="text-sm mt-2 text-slate-500">
            Operadora DWV &middot; Análise de Incorporadoras
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl p-8 border border-white/[0.06] bg-[#121212] backdrop-blur-[20px]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
                E-mail
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-600" style={{ fontSize: 20 }}>mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-[#ec1313]/40 focus:ring-2 focus:ring-[#ec1313]/10"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-600" style={{ fontSize: 20 }}>lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-[#ec1313]/40 focus:ring-2 focus:ring-[#ec1313]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-600" style={{ fontSize: 18 }}>
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {erro && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-[#ec1313]/10 border border-[#ec1313]/20 text-[#ec1313]">
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                {erro}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 bg-[#ec1313] hover:shadow-[0_6px_24px_rgba(236,19,19,0.4)]"
              style={{ boxShadow: loading ? "none" : "0 4px 16px rgba(236, 19, 19, 0.3)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          {/* Forgot Password */}
          <div className="text-center mt-5">
            <button
              onClick={() => router.push("/diagnostico/recuperar-senha")}
              className="text-xs transition-colors hover:underline text-[#ec1313]"
            >
              Esqueci minha senha
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] mt-8 uppercase tracking-widest text-slate-700">
          DWV Operadora &middot; Diagnóstico v1.0
        </p>
      </div>
    </div>
  );
}
