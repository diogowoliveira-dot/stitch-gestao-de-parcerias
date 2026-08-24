"use client";

import { useState } from "react";
import { Botao, Campo, Icon, Sheet } from "./ui";
import { useVisitas } from "@/lib/visitas-context";
import { fimDaSemana, fimDoDia, inicioDoDia } from "@/lib/visitas-types";

/**
 * Configuração dos lembretes por e-mail.
 * O app espelha a agenda no servidor (/api/visitas/sync) e os disparos
 * automáticos são feitos pelos Cron Jobs em /api/visitas/lembretes.
 */
export default function SheetLembretes({
  onFechar,
  onAvisar,
}: {
  onFechar: () => void;
  onAvisar: (msg: string, tipo?: "info" | "erro" | "sucesso") => void;
}) {
  const {
    perfil,
    setPerfil,
    agendamentos,
    imobiliarias,
    sincronizando,
    agendamentosNoIntervalo,
  } = useVisitas();

  const [enviando, setEnviando] = useState<"diario" | "semanal" | null>(null);

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(perfil.email.trim());

  const hoje = agendamentosNoIntervalo(
    inicioDoDia(new Date()),
    fimDoDia(new Date())
  ).filter((a) => a.status === "programada");

  const semana = agendamentosNoIntervalo(
    inicioDoDia(new Date()),
    fimDaSemana(new Date())
  ).filter((a) => a.status === "programada");

  async function enviarTeste(tipo: "diario" | "semanal") {
    if (!emailValido) {
      onAvisar("Informe um e-mail válido para receber os lembretes.", "erro");
      return;
    }
    setEnviando(tipo);
    try {
      const res = await fetch("/api/visitas/lembretes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          perfil,
          agendamentos: agendamentos.filter((a) => a.status === "programada"),
          imobiliarias,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.erro || `HTTP ${res.status}`);
      onAvisar(`E-mail enviado para ${perfil.email}.`, "sucesso");
    } catch (e) {
      onAvisar(`Falha ao enviar: ${(e as Error).message}`, "erro");
    } finally {
      setEnviando(null);
    }
  }

  return (
    <Sheet
      aberto
      onFechar={onFechar}
      titulo="Lembretes por e-mail"
      subtitulo="Resumo automático da sua agenda"
      rodape={
        <Botao full variante="secundario" icone="check" onClick={onFechar}>
          Concluir
        </Botao>
      }
    >
      <div className="rounded-xl border border-[#222] bg-[#111] p-3.5 mb-4 space-y-2">
        <div className="flex items-start gap-2.5">
          <Icon name="wb_twilight" size={18} className="text-[#ffc300] mt-0.5" />
          <p className="text-[13px] text-[#c0c0c0] leading-relaxed">
            <strong className="text-white">Todo dia às 7h</strong> — as visitas
            programadas para o dia.
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <Icon name="date_range" size={18} className="text-[#3b82f6] mt-0.5" />
          <p className="text-[13px] text-[#c0c0c0] leading-relaxed">
            <strong className="text-white">Toda segunda às 7h30</strong> — as visitas
            programadas para a semana.
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <Icon name="event_upcoming" size={18} className="text-[#00c29f] mt-0.5" />
          <p className="text-[13px] text-[#c0c0c0] leading-relaxed">
            <strong className="text-white">2 dias antes de cada visita</strong> — aviso
            para você e para o responsável da imobiliária.
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        <Campo
          label="Seu nome"
          icone="person"
          valor={perfil.nome}
          onChange={(v) => setPerfil({ nome: v })}
          placeholder="Como assinar o e-mail"
        />
        <Campo
          label="E-mail para receber"
          icone="mail"
          valor={perfil.email}
          onChange={(v) => setPerfil({ email: v })}
          placeholder="voce@dwvapp.com.br"
          tipo="email"
          inputMode="email"
          erro={
            perfil.email && !emailValido ? "Informe um e-mail válido." : undefined
          }
        />
      </div>

      <div className="mt-4 space-y-2">
        <Toggle
          label="Resumo diário"
          descricao={`${hoje.length} ${hoje.length === 1 ? "visita" : "visitas"} hoje`}
          ativo={perfil.lembreteDiario}
          onChange={(v) => setPerfil({ lembreteDiario: v })}
        />
        <Toggle
          label="Resumo semanal (segunda-feira)"
          descricao={`${semana.length} ${semana.length === 1 ? "visita" : "visitas"} até o fim da semana`}
          ativo={perfil.lembreteSemanal}
          onChange={(v) => setPerfil({ lembreteSemanal: v })}
        />
        <Toggle
          label="Aviso 2 dias antes"
          descricao="Você e o responsável recebem um lembrete da visita"
          ativo={perfil.avisoDoisDias}
          onChange={(v) => setPerfil({ avisoDoisDias: v })}
        />
        <Toggle
          label="Convidar o responsável ao agendar"
          descricao="Deixa a opção de convite de agenda já marcada"
          ativo={perfil.convidarResponsavel}
          onChange={(v) => setPerfil({ convidarResponsavel: v })}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-[#1c1c1c]">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a8a8a] mb-2">
          Enviar agora (teste)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Botao
            variante="secundario"
            icone="wb_twilight"
            disabled={!emailValido || enviando !== null}
            onClick={() => enviarTeste("diario")}
          >
            {enviando === "diario" ? "Enviando…" : "Resumo do dia"}
          </Botao>
          <Botao
            variante="secundario"
            icone="date_range"
            disabled={!emailValido || enviando !== null}
            onClick={() => enviarTeste("semanal")}
          >
            {enviando === "semanal" ? "Enviando…" : "Resumo da semana"}
          </Botao>
        </div>
        <p className="text-[11px] text-[#6a6a6a] mt-2 flex items-center gap-1.5">
          <Icon name={sincronizando ? "sync" : "cloud_done"} size={13} />
          {sincronizando
            ? "Sincronizando agenda com o servidor…"
            : emailValido
              ? "Agenda sincronizada — os envios automáticos usam esta cópia."
              : "Informe seu e-mail para ativar os envios automáticos."}
        </p>
      </div>
    </Sheet>
  );
}

function Toggle({
  label,
  descricao,
  ativo,
  onChange,
}: {
  label: string;
  descricao: string;
  ativo: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!ativo)}
      className="w-full flex items-center gap-3 rounded-xl border border-[#1f1f1f] bg-[#111] p-3 text-left transition hover:border-[#333]"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold">{label}</p>
        <p className="text-[11px] text-[#7a7a7a]">{descricao}</p>
      </div>
      <span
        className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition ${
          ativo ? "bg-[#00c29f]" : "bg-[#2a2a2a]"
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white transition-transform ${
            ativo ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
