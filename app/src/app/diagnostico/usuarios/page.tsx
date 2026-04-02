"use client";
import { useState } from "react";
import DiagShell from "@/components/diagnostico/DiagShell";
import { useDiagAuth } from "@/lib/diagnostico-context";
import type { DiagUserRole } from "@/lib/diagnostico-mock-data";

type UserInfo = { id: string; nome: string; email: string; role: string; status: string };

export default function UsuariosPage() {
  const { users, isAdmin, addUser, updateUser, deleteUser, user: currentUser } = useDiagAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Form state
  const [formNome, setFormNome] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<DiagUserRole>("consultor");
  const [formSenha, setFormSenha] = useState("");
  const [formStatus, setFormStatus] = useState<"ativo" | "inativo">("ativo");

  const openAdd = () => {
    setEditingUser(null);
    setFormNome("");
    setFormEmail("");
    setFormRole("consultor");
    setFormSenha("123456");
    setFormStatus("ativo");
    setShowModal(true);
  };

  const openEdit = (u: UserInfo) => {
    setEditingUser(u);
    setFormNome(u.nome);
    setFormEmail(u.email);
    setFormRole(u.role as DiagUserRole);
    setFormSenha("");
    setFormStatus(u.status as "ativo" | "inativo");
    setShowModal(true);
  };

  const handleResendInvite = async (userId: string) => {
    setResendingInvite(userId);
    try {
      const res = await fetch("/api/diagnostico/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });
      if (res.ok) {
        setResendSuccess(userId);
        setTimeout(() => setResendSuccess(null), 3000);
      }
    } finally {
      setResendingInvite(null);
    }
  };

  const handleSave = async () => {
    if (!formNome.trim() || !formEmail.trim()) return;

    if (editingUser) {
      const data: Record<string, string> = {
        nome: formNome,
        email: formEmail,
        role: formRole,
        status: formStatus,
      };
      if (formSenha.trim()) data.senha = formSenha;
      await updateUser(editingUser.id, data);
    } else {
      await addUser({
        nome: formNome,
        email: formEmail,
        role: formRole,
        status: formStatus,
        senha: formSenha || "123456",
      });
    }
    setShowModal(false);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <DiagShell title="Usuários" subtitle="Acesso restrito" icon="group">
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-slate-700 mb-3 block" style={{ fontSize: 48 }}>lock</span>
          <p className="text-sm text-slate-500">Apenas administradores podem gerenciar usuários</p>
        </div>
      </DiagShell>
    );
  }

  return (
    <DiagShell
      showBack
      title="Gestão de Usuários"
      subtitle={`${users.filter((u) => u.status === "ativo").length} ativos`}
      icon="group"
      actions={
        <button
          onClick={openAdd}
          className="p-2 rounded-lg transition-all hover:bg-white/5 text-[#ec1313]"
          title="Adicionar usuário"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person_add</span>
        </button>
      }
    >
      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500" style={{ fontSize: 20 }}>search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-600 outline-none transition-all bg-[#121212] border border-white/[0.06] focus:border-white/[0.15]"
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            className="rounded-2xl p-5 bg-[#121212] border border-white/[0.06] transition-all group"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                    u.status === "ativo"
                      ? "bg-[#ec1313]/10 border border-[#ec1313]/20 text-[#ec1313]"
                      : "bg-white/[0.04] border border-white/[0.06] text-slate-500"
                  }`}
                >
                  {u.nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">{u.nome}</p>
                    {u.id === currentUser?.id && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#ec1313]/10 text-[#ec1313]">
                        Você
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: u.role === "admin" ? "rgba(245, 158, 11, 0.1)" : "rgba(99, 102, 241, 0.1)",
                        color: u.role === "admin" ? "#f59e0b" : "#6366f1",
                        border: `1px solid ${u.role === "admin" ? "rgba(245, 158, 11, 0.2)" : "rgba(99, 102, 241, 0.2)"}`,
                      }}
                    >
                      {u.role === "admin" ? "Admin" : "Consultor"}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: u.status === "ativo" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        color: u.status === "ativo" ? "#10b981" : "#ef4444",
                      }}
                    >
                      {u.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleResendInvite(u.id)}
                  disabled={resendingInvite === u.id}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 text-slate-500 disabled:opacity-50"
                  title="Reenviar convite por e-mail"
                >
                  {resendSuccess === u.id ? (
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#10b981" }}>check_circle</span>
                  ) : resendingInvite === u.id ? (
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>forward_to_inbox</span>
                  )}
                </button>
                <button
                  onClick={() => openEdit(u)}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 text-slate-500"
                  title="Editar"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                </button>
                {u.id !== currentUser?.id && (
                  <button
                    onClick={() => setConfirmDelete(u.id)}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 text-slate-500"
                    title="Excluir"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Delete Confirmation */}
            {confirmDelete === u.id && (
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <p className="text-xs" style={{ color: "#ef4444" }}>Confirmar exclusão?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/5 transition-all text-slate-500"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => { deleteUser(u.id); setConfirmDelete(null); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                    style={{ background: "rgba(220, 38, 38, 0.8)" }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-2xl p-6 bg-[#121212] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/5 text-slate-500">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-slate-500">Nome</label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none bg-white/[0.03] border border-white/[0.06]"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-slate-500">E-mail</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none bg-white/[0.03] border border-white/[0.06]"
                  placeholder="email@dwv.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-slate-500">
                  {editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha"}
                </label>
                <input
                  type="password"
                  value={formSenha}
                  onChange={(e) => setFormSenha(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none bg-white/[0.03] border border-white/[0.06]"
                  placeholder={editingUser ? "••••••" : "Senha inicial"}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-slate-500">Perfil</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as DiagUserRole)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none bg-white/[0.03] border border-white/[0.06]"
                  >
                    <option value="consultor">Consultor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-slate-500">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as "ativo" | "inativo")}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none bg-white/[0.03] border border-white/[0.06]"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5 text-slate-400 border border-white/[0.06]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all bg-[#ec1313]"
              >
                {editingUser ? "Salvar" : "Criar Usuário"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DiagShell>
  );
}
