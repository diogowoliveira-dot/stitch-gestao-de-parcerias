"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { COMISSAO_POR_INDICACAO, ReferralStatus } from "@/lib/mock-data";

export default function ParceiroDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAdmin } = useAuth();
  const {
    parceiros,
    vendedores,
    getIndicacoesDoParceiro,
    addIndicacao,
    updateIndicacaoStatus,
    deleteParceiro,
    updateParceiro,
  } = useData();

  const parceiro = parceiros.find((p) => p.id === id);
  const indicacoes = parceiro ? getIndicacoesDoParceiro(parceiro.id) : [];
  const vendedorResp = vendedores.find((v) => v.id === parceiro?.vendedorId);

  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: parceiro?.nome || "",
    telefone: parceiro?.telefone || "",
    email: parceiro?.email || "",
    empresa: parceiro?.empresa || "",
  });
  const [form, setForm] = useState({
    empresaIndicada: "",
    contatoNome: "",
    contatoTelefone: "",
    contatoEmail: "",
    observacoes: "",
  });

  if (!parceiro) {
    return (
      <AppShell title="Parceiro" showBack>
        <div className="px-5 pt-20 text-center text-slate-600">
          <span className="material-symbols-outlined" style={{ fontSize: 48 }}>error</span>
          <p className="mt-2 text-sm">Parceiro não encontrado</p>
        </div>
      </AppShell>
    );
  }

  const fechadas = indicacoes.filter((i) => i.status === "fechada").length;
  const emNegociacao = indicacoes.filter((i) => i.status === "em_negociacao").length;
  const recusadas = indicacoes.filter((i) => i.status === "recusada").length;
  const comissaoTotal = fechadas * COMISSAO_POR_INDICACAO;

  const handleAddIndicacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresaIndicada || !form.contatoNome) return;
    addIndicacao({
      parceiroId: parceiro.id,
      empresaIndicada: form.empresaIndicada,
      contatoNome: form.contatoNome,
      contatoTelefone: form.contatoTelefone,
      contatoEmail: form.contatoEmail,
      status: "em_negociacao",
      observacoes: form.observacoes,
    });
    setForm({ empresaIndicada: "", contatoNome: "", contatoTelefone: "", contatoEmail: "", observacoes: "" });
    setShowForm(false);
  };

  const handleSaveEdit = () => {
    updateParceiro(parceiro.id, {
      nome: editForm.nome,
      telefone: editForm.telefone,
      email: editForm.email,
      empresa: editForm.empresa,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    deleteParceiro(parceiro.id);
    router.push("/parceiros");
  };

  const statusOptions: { value: ReferralStatus; label: string }[] = [
    { value: "em_negociacao", label: "Em Negociação" },
    { value: "fechada", label: "Fechada" },
    { value: "recusada", label: "Recusada" },
  ];

  return (
    <AppShell
      title={parceiro.nome}
      subtitle={parceiro.empresa}
      icon="person"
      showBack
    >
      {/* Partner info */}
      <section className="px-5 pt-6">
        <div className="bg-[#121212] rounded-xl p-5 border border-white/[0.06]">
          <div className="flex justify-between items-start mb-4">
            <StatusBadge status={parceiro.tipo} size="md" />
            <StatusBadge status={parceiro.status} />
          </div>

          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-[#ec1313]/40 transition-all"
                placeholder="Nome"
              />
              <input
                type="text"
                value={editForm.empresa}
                onChange={(e) => setEditForm({ ...editForm, empresa: e.target.value })}
                className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-[#ec1313]/40 transition-all"
                placeholder="Empresa"
              />
              <input
                type="tel"
                value={editForm.telefone}
                onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-[#ec1313]/40 transition-all"
                placeholder="Telefone"
              />
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-[#ec1313]/40 transition-all"
                placeholder="Email"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 h-10 border border-white/[0.08] rounded-lg text-xs text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 h-10 bg-[#ec1313] text-white rounded-lg text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-600" style={{ fontSize: 18 }}>call</span>
                  <span className="text-sm text-slate-300">{parceiro.telefone || "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-600" style={{ fontSize: 18 }}>mail</span>
                  <span className="text-sm text-slate-300">{parceiro.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-600" style={{ fontSize: 18 }}>business</span>
                  <span className="text-sm text-slate-300">{parceiro.empresa}</span>
                </div>
                {vendedorResp && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-600" style={{ fontSize: 18 }}>badge</span>
                    <span className="text-sm text-slate-300">Vendedor: {vendedorResp.nome}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-white/[0.04]">
                <button
                  onClick={() => {
                    setEditForm({
                      nome: parceiro.nome,
                      telefone: parceiro.telefone,
                      email: parceiro.email,
                      empresa: parceiro.empresa,
                    });
                    setEditing(true);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
                >
                  Editar
                </button>
                {isAdmin ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs font-bold text-red-500 hover:text-red-400 uppercase tracking-wider transition-colors ml-auto"
                  >
                    Excluir
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-600 ml-auto italic">
                    Solicite exclusão ao administrador
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <section className="px-5 pt-3">
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <p className="text-sm text-red-400 font-semibold mb-3">
              Tem certeza que deseja excluir este parceiro e todas as suas indicações?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-10 border border-white/[0.08] rounded-lg text-xs text-slate-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-10 bg-red-600 text-white rounded-lg text-xs font-bold"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="px-5 pt-4 grid grid-cols-4 gap-2">
        <div className="bg-[#121212] rounded-xl p-3 border border-white/[0.06] text-center">
          <p className="text-xl font-bold">{indicacoes.length}</p>
          <p className="text-[9px] text-slate-500 uppercase">Total</p>
        </div>
        <div className="bg-[#121212] rounded-xl p-3 border border-white/[0.06] text-center">
          <p className="text-xl font-bold text-amber-400">{emNegociacao}</p>
          <p className="text-[9px] text-slate-500 uppercase">Negociando</p>
        </div>
        <div className="bg-[#121212] rounded-xl p-3 border border-white/[0.06] text-center">
          <p className="text-xl font-bold text-emerald-400">{fechadas}</p>
          <p className="text-[9px] text-slate-500 uppercase">Fechadas</p>
        </div>
        <div className="bg-[#121212] rounded-xl p-3 border border-white/[0.06] text-center">
          <p className="text-xl font-bold text-red-400">{recusadas}</p>
          <p className="text-[9px] text-slate-500 uppercase">Recusadas</p>
        </div>
      </section>

      {/* Comissão */}
      <section className="px-5 pt-3">
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: 20 }}>payments</span>
            <span className="text-xs text-emerald-400 font-semibold">Comissão Total</span>
          </div>
          <span className="text-lg font-bold text-emerald-400">R$ {comissaoTotal.toLocaleString("pt-BR")}</span>
        </div>
      </section>

      {/* Add indicação button */}
      <section className="px-5 pt-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full h-12 bg-[#ec1313] hover:bg-[#d40000] text-white rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          NOVA INDICAÇÃO
        </button>
      </section>

      {/* New indicação form */}
      {showForm && (
        <section className="px-5 pt-4">
          <form onSubmit={handleAddIndicacao} className="bg-[#121212] rounded-xl p-5 border border-white/[0.06] space-y-4">
            <h3 className="text-sm font-bold">Nova Indicação</h3>
            <input
              type="text"
              placeholder="Nome da empresa indicada *"
              value={form.empresaIndicada}
              onChange={(e) => setForm({ ...form, empresaIndicada: e.target.value })}
              className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
              required
            />
            <input
              type="text"
              placeholder="Nome do contato *"
              value={form.contatoNome}
              onChange={(e) => setForm({ ...form, contatoNome: e.target.value })}
              className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
              required
            />
            <input
              type="tel"
              placeholder="Telefone do contato"
              value={form.contatoTelefone}
              onChange={(e) => setForm({ ...form, contatoTelefone: e.target.value })}
              className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
            />
            <input
              type="email"
              placeholder="Email do contato"
              value={form.contatoEmail}
              onChange={(e) => setForm({ ...form, contatoEmail: e.target.value })}
              className="w-full h-12 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all"
            />
            <textarea
              placeholder="Observações"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#ec1313]/40 transition-all resize-none"
            />
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: 18 }}>info</span>
              <span className="text-[11px] text-slate-400">
                Comissão de R$ {COMISSAO_POR_INDICACAO.toLocaleString("pt-BR")} será atribuída ao parceiro
              </span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 h-12 border border-white/[0.08] rounded-xl text-sm text-slate-400 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 h-12 bg-[#ec1313] hover:bg-[#d40000] text-white rounded-xl text-sm font-bold transition-all"
              >
                Cadastrar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Indicações list */}
      <section className="px-5 pt-5 pb-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Indicações ({indicacoes.length})
        </h3>
        <div className="space-y-3">
          {indicacoes.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              <span className="material-symbols-outlined" style={{ fontSize: 40 }}>inbox</span>
              <p className="mt-2 text-sm">Nenhuma indicação cadastrada</p>
            </div>
          ) : (
            indicacoes.map((ind) => (
              <div
                key={ind.id}
                className="bg-[#121212] rounded-xl p-4 border border-white/[0.06]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{ind.empresaIndicada}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{ind.contatoNome}</p>
                  </div>
                  <StatusBadge status={ind.status} />
                </div>
                {ind.observacoes && (
                  <p className="text-[11px] text-slate-500 mt-2 italic">&ldquo;{ind.observacoes}&rdquo;</p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                  <span className="text-[11px] text-slate-600">{ind.dataIndicacao}</span>
                  {ind.status === "fechada" && (
                    <span className="text-[11px] font-bold text-emerald-400">
                      R$ {ind.valorComissao.toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
                {/* Status change */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.04]">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateIndicacaoStatus(ind.id, opt.value)}
                      disabled={ind.status === opt.value}
                      className={`flex-1 h-8 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        ind.status === opt.value
                          ? "bg-white/5 text-slate-600 cursor-default"
                          : "border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
