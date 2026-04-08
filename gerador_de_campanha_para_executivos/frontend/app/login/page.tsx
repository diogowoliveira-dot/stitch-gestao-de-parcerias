"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="w-full max-w-sm px-8 py-10 bg-[#141414] border border-[rgba(201,169,110,0.15)] rounded-sm">
        <div className="mb-8">
          <div className="w-12 h-0.5 bg-gold mb-4" />
          <h1 className="font-serif text-2xl font-bold text-white">Campaign Studio</h1>
          <p className="text-sm text-white/40 mt-1">DWV Parcerias</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-widest text-white/40 uppercase mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.08)] text-white px-4 py-3 text-sm outline-none focus:border-gold/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-widest text-white/40 uppercase mb-1.5">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.08)] text-white px-4 py-3 text-sm outline-none focus:border-gold/50 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-dark font-bold text-sm tracking-widest uppercase py-3 hover:bg-gold/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
