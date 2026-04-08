"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/diagnostico/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Sempre mostra sucesso (não revela se o e-mail existe)
      setEnviado(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #ec1313 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 bg-[#ec1313]" style={{ boxShadow: "0 8px 32px rgba(236, 19, 19, 0.3)" }}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: 28 }}>lock_reset</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Recuperar Senha</h1>
          <p className="text-sm mt-2 text-slate-500">Enviaremos um link para seu e-mail</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border border-white/[0.06] bg-[#121212] backdrop-blur-[20px]">
          {enviado ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#10b981" }}>mark_email_read</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Verifique seu e-mail</h2>
              <p className="text-sm mb-6 text-slate-500">
                Se <strong className="text-white">{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha em instantes. O link é válido por <strong className="text-white">1 hora</strong>.
              </p>
              <p className="text-xs mb-6 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400">
                Não recebeu? Verifique a pasta de spam ou tente novamente em alguns minutos.
              </p>
              <button
                onClick={() => router.push("/diagnostico")}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all bg-[#ec1313]"
              >
                Voltar ao Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">
                  E-mail cadastrado
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 bg-[#ec1313]"
                style={{ boxShadow: loading ? "none" : "0 4px 16px rgba(236, 19, 19, 0.3)" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Enviando...
                  </span>
                ) : (
                  "Enviar link de recuperação"
                )}
              </button>
            </form>
          )}

          {!enviado && (
            <div className="text-center mt-5">
              <button
                onClick={() => router.push("/diagnostico")}
                className="text-xs transition-colors hover:underline text-[#ec1313]"
              >
                Voltar ao login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
