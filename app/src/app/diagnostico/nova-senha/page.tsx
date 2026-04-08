"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function NovaSenhaForm() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  useEffect(() => {
    if (!token) { setTokenValido(false); }
    else { setTokenValido(true); }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (novaSenha.length < 6) { setErro("A senha deve ter ao menos 6 caracteres."); return; }
    if (novaSenha !== confirmar) { setErro("As senhas não coincidem."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/diagnostico/auth/reset-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || "Erro ao redefinir a senha."); return; }
      setSucesso(true);
    } finally {
      setLoading(false);
    }
  };

  if (tokenValido === false) {
    return (
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: "rgba(236, 19, 19, 0.1)", border: "1px solid rgba(236, 19, 19, 0.2)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#ec1313" }}>link_off</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Link inválido</h2>
        <p className="text-sm mb-6 text-slate-500">Este link é inválido ou expirou. Solicite um novo link de recuperação.</p>
        <button onClick={() => router.push("/diagnostico/recuperar-senha")} className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#ec1313]">
          Solicitar novo link
        </button>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#10b981" }}>check_circle</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Senha redefinida!</h2>
        <p className="text-sm mb-6 text-slate-500">Sua senha foi atualizada com sucesso. Faça login com a nova senha.</p>
        <button onClick={() => router.push("/diagnostico")} className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#ec1313]">
          Ir para o Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">Nova senha</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-600" style={{ fontSize: 20 }}>lock</span>
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-[#ec1313]/40 focus:ring-2 focus:ring-[#ec1313]/10"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-500">Confirmar senha</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-600" style={{ fontSize: 20 }}>lock_clock</span>
          <input
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="Repita a nova senha"
            required
            className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all bg-white/[0.03] border border-white/[0.06] focus:border-[#ec1313]/40 focus:ring-2 focus:ring-[#ec1313]/10"
          />
        </div>
      </div>

      {erro && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-[#ec1313]/10 border border-[#ec1313]/20 text-[#ec1313]">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
          {erro}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 bg-[#ec1313]"
        style={{ boxShadow: loading ? "none" : "0 4px 16px rgba(236, 19, 19, 0.3)" }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Salvando...
          </span>
        ) : "Redefinir Senha"}
      </button>
    </form>
  );
}

export default function NovaSenha() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-72 h-72 rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #ec1313 0%, transparent 70%)" }} />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 bg-[#ec1313]" style={{ boxShadow: "0 8px 32px rgba(236, 19, 19, 0.3)" }}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: 28 }}>key</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nova Senha</h1>
          <p className="text-sm mt-2 text-slate-500">Defina sua nova senha de acesso</p>
        </div>
        <div className="rounded-2xl p-8 border border-white/[0.06] bg-[#121212] backdrop-blur-[20px]">
          <Suspense fallback={<div className="text-center text-slate-500 py-8">Carregando...</div>}>
            <NovaSenhaForm />
          </Suspense>
        </div>
        <div className="text-center mt-5">
          <button onClick={() => router.push("/diagnostico")} className="text-xs transition-colors hover:underline text-[#ec1313]">
            Voltar ao login
          </button>
        </div>
      </div>
    </div>
  );
}
