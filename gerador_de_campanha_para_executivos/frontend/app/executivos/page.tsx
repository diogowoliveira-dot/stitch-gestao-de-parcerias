"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, User } from "lucide-react";
import { apiGet, apiPostForm, apiPutForm, apiDelete, type Executivo } from "@/lib/api";
import NavBar from "@/components/NavBar";

export default function ExecutivosPage() {
  const [executivos, setExecutivos] = useState<Executivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Executivo | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<Executivo[]>("/executivos/");
      setExecutivos(data);
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setShowForm(true);
    setError("");
  }

  function openEdit(e: Executivo) {
    setEditing(e);
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const form = new FormData(e.currentTarget);
      if (editing) {
        await apiPutForm(`/executivos/${editing.id}`, form);
      } else {
        await apiPostForm("/executivos/", form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Desativar este executivo?")) return;
    await apiDelete(`/executivos/${id}`);
    await load();
  }

  return (
    <div className="flex min-h-screen bg-dark">
      <NavBar />
      <main className="ml-56 flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-white">Executivos</h1>
            <p className="text-sm text-white/40 mt-0.5">{executivos.length} cadastrado{executivos.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-gold text-dark text-sm font-bold px-5 py-2.5 hover:bg-gold/90 transition-colors"
          >
            <Plus size={16} /> Novo Executivo
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-white/30 text-sm">Carregando...</p>
        ) : executivos.length === 0 ? (
          <div className="border border-[rgba(255,255,255,0.06)] rounded-sm p-16 text-center">
            <div className="w-10 h-0.5 bg-gold mx-auto mb-4" />
            <p className="text-white/40 text-sm">Nenhum executivo cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {executivos.map((ex) => (
              <div
                key={ex.id}
                className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-sm p-5 flex gap-4"
              >
                {/* Foto */}
                <div className="w-14 h-14 rounded-full border-2 border-gold/40 overflow-hidden flex-shrink-0 bg-[#222] flex items-center justify-center">
                  {ex.foto_b64 ? (
                    <img src={ex.foto_b64} alt={ex.nome} className="w-full h-full object-cover" />
                  ) : (
                    <User size={22} className="text-white/20" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm leading-tight">{ex.nome}</p>
                  <p className="text-xs text-white/40 mt-0.5">{ex.cargo}</p>
                  {ex.regiao && <p className="text-xs text-white/25 mt-0.5">{ex.regiao}</p>}
                  {ex.whatsapp && <p className="text-xs text-gold/70 mt-1">{ex.whatsapp}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => openEdit(ex)}
                    className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(ex.id)}
                    className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-sm w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-lg font-bold text-white">
                {editing ? "Editar Executivo" : "Novo Executivo"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/60 text-xl leading-none">×</button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nome completo" name="nome" required defaultValue={editing?.nome} />
              <Field label="Cargo" name="cargo" defaultValue={editing?.cargo || "Executivo de Parcerias"} />
              <Field label="Região" name="regiao" defaultValue={editing?.regiao} />
              <Field label="WhatsApp" name="whatsapp" defaultValue={editing?.whatsapp} placeholder="+55 47 99999-0000" />
              <Field label="E-mail" name="email" type="email" defaultValue={editing?.email} />

              <div>
                <label className="block text-xs font-semibold tracking-widest text-white/40 uppercase mb-1.5">
                  Foto
                </label>
                <input
                  type="file"
                  name="foto"
                  accept="image/*"
                  className="w-full text-xs text-white/50 file:mr-3 file:py-1.5 file:px-3 file:bg-gold/10 file:text-gold file:text-xs file:font-semibold file:border-0 file:cursor-pointer"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-white/10 text-white/50 text-sm font-semibold py-2.5 hover:border-white/20 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gold text-dark text-sm font-bold py-2.5 hover:bg-gold/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, name, required, defaultValue, type = "text", placeholder,
}: {
  label: string; name: string; required?: boolean;
  defaultValue?: string; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-widest text-white/40 uppercase mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.08)] text-white px-3 py-2.5 text-sm outline-none focus:border-gold/50 transition-colors"
      />
    </div>
  );
}
