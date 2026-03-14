"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import AppShell from "@/components/AppShell";

export default function PortabilidadePage() {
  const { isAdmin } = useAuth();
  const { vendedores, parceiros, transferirCarteira, getParceirosDoVendedor, getStatsVendedor } = useData();

  const [origemId, setOrigemId] = useState("");
  const [destinoId, setDestinoId] = useState("");
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isAdmin) {
    return (
      <AppShell title="Acesso Negado" icon="block">
        <div className="px-5 pt-20 text-center">
          <span className="material-symbols-outlined text-slate-600" style={{ fontSize: 64 }}>lock</span>
          <p className="text-slate-400 mt-4">Apenas administradores podem acessar esta página.</p>
        </div>
      </AppShell>
    );
  }

  const origemVendedor = vendedores.find((v) => v.id === origemId);
  const destinoVendedor = vendedores.find((v) => v.id === destinoId);
  const parceirosOrigem = origemId ? getParceirosDoVendedor(origemId) : [];
  const statsOrigem = origemId ? getStatsVendedor(origemId) : null;

  const handleTransfer = () => {
    if (!origemId || !destinoId || origemId === destinoId) return;
    transferirCarteira(origemId, destinoId);
    setSuccess(true);
    setShowConfirm(false);
    setTimeout(() => {
      setSuccess(false);
      setOrigemId("");
      setDestinoId("");
    }, 3000);
  };

  return (
    <AppShell title="Portabilidade" subtitle="Transferir carteira de parceiros" icon="swap_horiz">
      <div className="px-5 pt-6 pb-8 space-y-6">
        {/* Info */}
        <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-purple-400 mt-0.5" style={{ fontSize: 20 }}>info</span>
          <div>
            <p className="text-sm font-semibold text-purple-300">Transferência de Carteira</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Transfira todos os parceiros e suas indicações de um vendedor para outro.
              Ideal para quando um vendedor sai da empresa ou para redistribuição de carteiras.
            </p>
          </div>
        </div>

        {/* Success */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: 20 }}>check_circle</span>
            <p className="text-sm text-emerald-400 font-semibold">
              Carteira transferida com sucesso!
            </p>
          </div>
        )}

        {/* Vendedor Origem */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">
            Vendedor de Origem
          </label>
          <select
            value={origemId}
            onChange={(e) => {
              setOrigemId(e.target.value);
              setDestinoId("");
              setShowConfirm(false);
            }}
            className="w-full h-13 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white focus:outline-none focus:border-[#ec1313]/40 transition-all appearance-none"
          >
            <option value="" className="bg-[#121212]">Selecionar vendedor...</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id} className="bg-[#121212]">
                {v.nome} {v.status === "inativo" ? "(Inativo)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Preview da carteira */}
        {origemId && (
          <div className="bg-[#121212] rounded-xl p-5 border border-white/[0.06]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Carteira de {origemVendedor?.nome}
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{statsOrigem?.totalParceiros}</p>
                <p className="text-[10px] text-slate-500">Parceiros</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{statsOrigem?.totalIndicacoes}</p>
                <p className="text-[10px] text-slate-500">Indicações</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{statsOrigem?.fechadas}</p>
                <p className="text-[10px] text-slate-500">Fechadas</p>
              </div>
            </div>
            {parceirosOrigem.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-white/[0.04]">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Parceiros que serão transferidos:</p>
                {parceirosOrigem.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ec1313]" />
                    {p.nome} ({p.empresa})
                  </div>
                ))}
              </div>
            )}
            {parceirosOrigem.length === 0 && (
              <p className="text-sm text-slate-600 text-center py-4">
                Este vendedor não possui parceiros na carteira.
              </p>
            )}
          </div>
        )}

        {/* Vendedor Destino */}
        {origemId && parceirosOrigem.length > 0 && (
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 block">
              Vendedor de Destino
            </label>
            <select
              value={destinoId}
              onChange={(e) => {
                setDestinoId(e.target.value);
                setShowConfirm(false);
              }}
              className="w-full h-13 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white focus:outline-none focus:border-[#ec1313]/40 transition-all appearance-none"
            >
              <option value="" className="bg-[#121212]">Selecionar vendedor destino...</option>
              {vendedores
                .filter((v) => v.id !== origemId && v.status === "ativo")
                .map((v) => (
                  <option key={v.id} value={v.id} className="bg-[#121212]">
                    {v.nome}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Transfer button */}
        {origemId && destinoId && origemId !== destinoId && (
          <>
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full h-14 bg-[#ec1313] hover:bg-[#d40000] text-white rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#ec1313]/20"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>swap_horiz</span>
                TRANSFERIR CARTEIRA
              </button>
            ) : (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <span className="material-symbols-outlined text-amber-400 mt-0.5" style={{ fontSize: 20 }}>warning</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-300">Confirmar Transferência</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Todos os <strong>{parceirosOrigem.length} parceiros</strong> e suas indicações serão transferidos
                      de <strong>{origemVendedor?.nome}</strong> para <strong>{destinoVendedor?.nome}</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 h-12 border border-white/[0.08] rounded-xl text-sm text-slate-400 hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleTransfer}
                    className="flex-1 h-12 bg-[#ec1313] hover:bg-[#d40000] text-white rounded-xl text-sm font-bold transition-all"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
