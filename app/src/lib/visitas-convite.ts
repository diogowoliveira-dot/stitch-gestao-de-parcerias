"use client";

import type { Agendamento, Imobiliaria, Perfil } from "./visitas-types";
import { linkGoogleAgenda } from "./visitas-ics";

export interface ResultadoConvite {
  ok: boolean;
  mensagem: string;
}

/**
 * Dispara o convite de agenda da visita (ou o cancelamento).
 * O convite vai por e-mail com anexo .ics — é o que faz o evento aparecer
 * no Google Agenda do responsável, com botão de confirmar.
 */
export async function enviarConviteAgenda({
  agendamento,
  imobiliaria,
  perfil,
  acao = "convite",
}: {
  agendamento: Agendamento;
  imobiliaria: Imobiliaria;
  perfil: Perfil;
  acao?: "convite" | "cancelamento";
}): Promise<ResultadoConvite> {
  if (!perfil.email) {
    return {
      ok: false,
      mensagem: "Configure seu e-mail em Agenda → Lembretes para enviar convites.",
    };
  }

  try {
    const res = await fetch("/api/visitas/convite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acao,
        uid: agendamento.id,
        inicio: agendamento.inicio,
        duracaoMin: agendamento.duracaoMin,
        motivo: agendamento.motivo,
        observacao: agendamento.observacao,
        imobiliaria: imobiliaria.nome,
        endereco: imobiliaria.endereco,
        lat: imobiliaria.lat,
        lng: imobiliaria.lng,
        organizador: { nome: perfil.nome, email: perfil.email },
        convidado: {
          nome: imobiliaria.responsavel.nome,
          email: imobiliaria.responsavel.email,
        },
      }),
    });

    const dados = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, mensagem: dados?.erro || `Falha no envio (HTTP ${res.status}).` };
    }

    const destino = imobiliaria.responsavel.email;
    return {
      ok: true,
      mensagem:
        acao === "cancelamento"
          ? "Cancelamento enviado para a agenda dos participantes."
          : dados?.convidado
            ? `Convite enviado para ${destino}.`
            : "Convite enviado para a sua agenda.",
    };
  } catch (e) {
    return { ok: false, mensagem: `Falha no envio: ${(e as Error).message}` };
  }
}

/** Link "Adicionar ao Google Agenda" para o próprio executivo */
export function linkAgendaDoAgendamento(
  agendamento: Agendamento,
  imobiliaria: Imobiliaria,
  perfil: Perfil
): string {
  return linkGoogleAgenda({
    uid: agendamento.id,
    inicio: agendamento.inicio,
    duracaoMin: agendamento.duracaoMin,
    imobiliaria: imobiliaria.nome,
    motivo: agendamento.motivo,
    observacao: agendamento.observacao,
    endereco: imobiliaria.endereco,
    lat: imobiliaria.lat,
    lng: imobiliaria.lng,
    organizador: { nome: perfil.nome, email: perfil.email },
    convidado: imobiliaria.responsavel.email
      ? {
          nome: imobiliaria.responsavel.nome,
          email: imobiliaria.responsavel.email,
        }
      : null,
  });
}
