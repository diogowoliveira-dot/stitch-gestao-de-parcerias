"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  executivos,
  gestor,
  getCorretoresTotal,
  getCorretoresAtivos,
  getCorretoresInativos,
  getCorretoresNovos,
  getImobiliariasIntegradas,
  getImobiliariasNaoIntegradas,
  getImobiliariasNovas,
  getTotalEventosParticipantes,
  getSemaforoColor,
  getPctAtingimento,
  type Executivo,
} from "@/lib/parcerias-mock-data";
import SimuladorMetas from "@/components/parcerias/SimuladorMetas";

// ——————————————————————————————————————————
// SEMÁFORO COLORS
// ——————————————————————————————————————————
const SEMAFORO = {
  verde: { bg: "#00CC44", text: "#00CC44", bar: "#00CC44" },
  amarelo: { bg: "#FFCC00", text: "#FFCC00", bar: "#FFCC00" },
  vermelho: { bg: "#CC0000", text: "#CC0000", bar: "#CC0000" },
};

const PERIODOS = [
  { label: "Mês atual", value: "mes_atual" },
  { label: "Mês anterior", value: "mes_anterior" },
  { label: "Últimos 30 dias", value: "30d" },
  { label: "Últimos 90 dias", value: "90d" },
];

// ——————————————————————————————————————————
// KPI CARD COMPONENT
// ——————————————————————————————————————————
function KpiCard({
  label,
  valor,
  colorOverride,
  sublabel,
  small,
}: {
  label: string;
  valor: string | number;
  colorOverride?: string;
  sublabel?: string;
  small?: boolean;
}) {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 flex flex-col gap-1">
      <span className="text-[#888888] text-xs font-medium uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`${small ? "text-xl" : "text-2xl"} font-bold`}
        style={{ color: colorOverride || "#FFFFFF" }}
      >
        {valor}
      </span>
      {sublabel && (
        <span className="text-[#666666] text-[11px]">{sublabel}</span>
      )}
    </div>
  );
}

// ——————————————————————————————————————————
// META CARD COMPONENT (with progress bar)
// ——————————————————————————————————————————
function MetaCard({
  label,
  atual,
  meta,
}: {
  label: string;
  atual: number;
  meta: number;
}) {
  const pct = getPctAtingimento(atual, meta);
  const semaforo = getSemaforoColor(atual, meta);
  const cor = SEMAFORO[semaforo];

  return (
    <div className="bg-[#111111] border-2 border-[#CC0000] rounded-lg p-5 flex flex-col gap-3">
      <span className="text-[#CC0000] text-xs font-semibold uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{atual}</span>
        <span className="text-[#555555] text-lg font-medium">/ {meta}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-[5px] bg-[#222222] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: cor.bar,
            }}
          />
        </div>
        <span
          className="text-sm font-bold min-w-[42px] text-right"
          style={{ color: cor.text }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}

// ——————————————————————————————————————————
// SECTION HEADER
// ——————————————————————————————————————————
function SectionHeader({
  title,
  icon,
}: {
  title: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-10">
      <span className="material-symbols-outlined text-[#CC0000] text-xl">
        {icon}
      </span>
      <h2 className="text-[#CC0000] text-sm font-bold uppercase tracking-widest">
        {title}
      </h2>
      <div className="flex-1 h-px bg-[#1A1A1A] ml-3" />
    </div>
  );
}

// ——————————————————————————————————————————
// MAIN PAGE
// ——————————————————————————————————————————
export default function ExecutivoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ExecutivoDashboard />
    </Suspense>
  );
}

function ExecutivoDashboard() {
  const searchParams = useSearchParams();
  const [periodo, setPeriodo] = useState("mes_atual");

  const urlId = searchParams.get("id");
  const isGestorView = searchParams.get("gestor") === "true";
  const [execId, setExecId] = useState(urlId || "exec1");

  useEffect(() => {
    if (urlId) setExecId(urlId);
  }, [urlId]);

  const viewingAsGestor = isGestorView;
  const exec = executivos.find((e) => e.id === execId) || executivos[0];

  const totalCorretores = getCorretoresTotal(exec);
  const corretoresAtivos = getCorretoresAtivos(exec);
  const corretoresInativos = getCorretoresInativos(exec);
  const corretoresNovos = getCorretoresNovos(exec);
  const imobIntegradas = getImobiliariasIntegradas(exec);
  const imobNaoIntegradas = getImobiliariasNaoIntegradas(exec);
  const imobNovas = getImobiliariasNovas(exec);
  const mediaCorretoresPorVisita =
    exec.visitas.realizadas > 0
      ? (exec.visitas.corretoresAlcancados / exec.visitas.realizadas).toFixed(1)
      : "0";
  const totalParticipantes = getTotalEventosParticipantes(exec);

  const pctPropostas = getPctAtingimento(
    exec.propostas.total,
    exec.meta.propostas
  );
  const semaforoPropostas = getSemaforoColor(
    exec.propostas.total,
    exec.meta.propostas
  );

  const ACOES_GRID = [
    {
      label: "Compartilhamentos",
      valor: exec.acoes.compartilhamentos,
      icon: "share",
    },
    {
      label: "WhatsApp / Chat",
      valor: exec.acoes.chamadasWhatsApp,
      icon: "chat",
    },
    {
      label: "Participações em Eventos",
      valor: exec.acoes.participacoesEventos,
      icon: "event",
    },
    {
      label: "Integrações de Imóvel",
      valor: exec.acoes.integracoesImovel,
      icon: "home_work",
    },
    {
      label: "Solic. Tabela de Vendas",
      valor: exec.acoes.solicitacoesTabela,
      icon: "table_chart",
    },
    {
      label: "Propostas Criadas",
      valor: exec.acoes.propostasCriadas,
      icon: "description",
    },
    {
      label: "Solic. Autorização",
      valor: exec.acoes.solicitacoesAutorizacao,
      icon: "verified",
    },
    {
      label: "Pontuações",
      valor: exec.acoes.pontuacoes,
      icon: "stars",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* TOP BAR */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-[#1A1A1A]">
        <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#CC0000] font-extrabold text-lg tracking-tight">
              DWV
            </span>
            <span className="text-[#333333]">|</span>
            <span className="text-[#666666] text-sm">Canal de Parcerias</span>
          </div>
          <div className="flex items-center gap-4">
            {viewingAsGestor && (
              <a
                href="/parcerias/gestor"
                className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-white transition-colors bg-[#1A1A1A] rounded px-3 py-1.5 border border-[#333333]"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Voltar ao Painel do Gestor
              </a>
            )}
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="bg-[#111111] border border-[#333333] text-white text-xs rounded px-3 py-1.5 focus:outline-none focus:border-[#CC0000] cursor-pointer"
            >
              {PERIODOS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 pb-20">
        {/* HEADER DO PERFIL */}
        <div className="flex items-center gap-5 py-8 border-b border-[#1A1A1A]">
          <div className="w-16 h-16 rounded-full bg-[#CC0000]/10 border-2 border-[#CC0000] flex items-center justify-center">
            <span className="text-[#CC0000] font-bold text-xl">
              {exec.iniciais}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{exec.nome}</h1>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  exec.status === "ativo"
                    ? "bg-[#00CC44]/10 text-[#00CC44] border border-[#00CC44]/20"
                    : "bg-[#666666]/10 text-[#666666] border border-[#666666]/20"
                }`}
              >
                {exec.status}
              </span>
              {viewingAsGestor && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/20">
                  Visão do Gestor
                </span>
              )}
            </div>
            <p className="text-[#888888] text-sm mt-0.5">{exec.cargo}</p>
            <p className="text-[#555555] text-xs mt-0.5">
              Gestor: {gestor.nome}
            </p>
          </div>
          {/* EXEC SELECTOR (for demo) */}
          <select
            value={execId}
            onChange={(e) => setExecId(e.target.value)}
            className="bg-[#111111] border border-[#333333] text-white text-xs rounded px-3 py-1.5 focus:outline-none focus:border-[#CC0000] cursor-pointer"
          >
            {executivos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>

        {/* METAS DO PERÍODO */}
        <SectionHeader title="Metas do Período" icon="flag" />
        <div className="grid grid-cols-3 gap-4">
          <MetaCard
            label="Propostas Mensais"
            atual={exec.propostas.total}
            meta={exec.meta.propostas}
          />
          <MetaCard
            label="Corretores Ativos"
            atual={corretoresAtivos}
            meta={exec.meta.corretoresAtivos}
          />
          <MetaCard
            label="Imobiliárias na Carteira"
            atual={exec.imobiliarias.length}
            meta={exec.meta.imobiliarias}
          />
        </div>

        {/* IMOBILIÁRIAS */}
        <SectionHeader title="Imobiliárias" icon="apartment" />
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label="Total na Carteira"
            valor={exec.imobiliarias.length}
          />
          <KpiCard
            label="Integradas ao Sistema"
            valor={imobIntegradas}
            colorOverride="#FFFFFF"
          />
          <KpiCard
            label="Não Integradas"
            valor={imobNaoIntegradas}
            colorOverride={imobNaoIntegradas > 0 ? "#FFCC00" : "#FFFFFF"}
          />
          <KpiCard
            label="Novas no Período"
            valor={imobNovas}
            colorOverride="#00CC44"
          />
        </div>

        {/* CORRETORES */}
        <SectionHeader title="Corretores" icon="groups" />
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Total na Carteira" valor={totalCorretores} />
          <KpiCard
            label="Ativos no Período"
            valor={corretoresAtivos}
            colorOverride={
              SEMAFORO[getSemaforoColor(corretoresAtivos, exec.meta.corretoresAtivos)]
                .text
            }
          />
          <KpiCard
            label="Inativos no Período"
            valor={corretoresInativos}
            colorOverride={
              corretoresInativos / totalCorretores > 0.4
                ? "#CC0000"
                : corretoresInativos / totalCorretores > 0.2
                ? "#FFCC00"
                : "#FFFFFF"
            }
          />
          <KpiCard
            label="Novos no Período"
            valor={corretoresNovos}
            colorOverride="#00CC44"
          />
        </div>

        {/* PROPOSTAS (DESTAQUE) */}
        <SectionHeader title="Propostas" icon="description" />
        <div className="bg-[#111111] border-2 border-[#CC0000] rounded-lg p-6">
          <div className="grid grid-cols-4 gap-4 mb-5">
            <div className="flex flex-col gap-1">
              <span className="text-[#888888] text-xs font-medium uppercase tracking-wider">
                Total Geradas
              </span>
              <span className="text-3xl font-bold text-white">
                {exec.propostas.total}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#888888] text-xs font-medium uppercase tracking-wider">
                Aceitas
              </span>
              <span className="text-3xl font-bold text-[#00CC44]">
                {exec.propostas.aceitas}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#888888] text-xs font-medium uppercase tracking-wider">
                Recusadas
              </span>
              <span className="text-3xl font-bold text-[#CC0000]">
                {exec.propostas.recusadas}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[#888888] text-xs font-medium uppercase tracking-wider">
                Em Aberto
              </span>
              <span className="text-3xl font-bold text-[#FFCC00]">
                {exec.propostas.emAberto}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 pt-4 border-t border-[#222222]">
            <div className="flex-1 h-[5px] bg-[#222222] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(pctPropostas, 100)}%`,
                  backgroundColor: SEMAFORO[semaforoPropostas].bar,
                }}
              />
            </div>
            <span className="text-sm text-[#888888]">
              {exec.propostas.total} / {exec.meta.propostas} —{" "}
              <span
                className="font-bold"
                style={{ color: SEMAFORO[semaforoPropostas].text }}
              >
                {pctPropostas}%
              </span>
            </span>
          </div>
        </div>

        {/* SIMULADOR DE METAS */}
        <div className="mt-10">
        <SimuladorMetas
          metaPropostasInicial={exec.meta.propostas}
          propostasAtuaisInicial={exec.propostas.total}
          corretoresCarteiraInicial={totalCorretores}
          corretoresAtivosInicial={corretoresAtivos}
        />
        </div>

        {/* ACESSOS AOS PRODUTOS */}
        <SectionHeader title="Acessos aos Produtos" icon="storefront" />
        <KpiCard
          label="Total de Acessos no Período"
          valor={exec.acessosProdutos}
          sublabel="Acessos realizados por corretores da carteira"
        />

        {/* VISITAS ÀS IMOBILIÁRIAS */}
        <SectionHeader title="Visitas às Imobiliárias" icon="location_on" />
        <div className="grid grid-cols-3 gap-4">
          <KpiCard
            label="Visitas Realizadas"
            valor={exec.visitas.realizadas}
          />
          <KpiCard
            label="Corretores Alcançados"
            valor={exec.visitas.corretoresAlcancados}
            sublabel="Via check-in no QR code"
          />
          <KpiCard
            label="Média por Visita"
            valor={mediaCorretoresPorVisita}
            sublabel="corretores / visita"
          />
        </div>

        {/* EVENTOS */}
        <SectionHeader title="Eventos" icon="celebration" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <KpiCard
            label="Eventos Criados"
            valor={exec.eventos.length}
          />
          <KpiCard
            label="Corretores Participantes"
            valor={totalParticipantes}
          />
        </div>
        {exec.eventos.length > 0 && (
          <div className="bg-[#111111] border border-[#222222] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A1A1A]">
                  <th className="text-left text-[#555555] text-xs font-medium uppercase tracking-wider px-4 py-3">
                    Evento
                  </th>
                  <th className="text-left text-[#555555] text-xs font-medium uppercase tracking-wider px-4 py-3">
                    Data
                  </th>
                  <th className="text-right text-[#555555] text-xs font-medium uppercase tracking-wider px-4 py-3">
                    Participantes
                  </th>
                </tr>
              </thead>
              <tbody>
                {exec.eventos.map((ev) => (
                  <tr
                    key={ev.id}
                    className="border-b border-[#1A1A1A] last:border-0"
                  >
                    <td className="px-4 py-3 text-white font-medium">
                      {ev.nome}
                    </td>
                    <td className="px-4 py-3 text-[#888888]">
                      {new Date(ev.data).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-bold">
                      {ev.participantes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RESUMO DE AÇÕES DA CARTEIRA */}
        <SectionHeader title="Resumo de Ações da Carteira" icon="analytics" />
        <div className="grid grid-cols-4 gap-3">
          {ACOES_GRID.map((acao) => (
            <div
              key={acao.label}
              className="bg-[#111111] border border-[#222222] rounded-lg p-4 flex items-start gap-3"
            >
              <span className="material-symbols-outlined text-[#CC0000]/60 text-lg mt-0.5">
                {acao.icon}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-bold text-white">
                  {acao.valor}
                </span>
                <span className="text-[#888888] text-[11px] font-medium leading-tight">
                  {acao.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CARTEIRA DE IMOBILIÁRIAS — LISTAGEM */}
        <SectionHeader
          title="Carteira de Imobiliárias"
          icon="domain"
        />
        <div className="bg-[#111111] border border-[#222222] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="text-left text-[#555555] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Imobiliária
                </th>
                <th className="text-right text-[#555555] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Total Corretores
                </th>
                <th className="text-right text-[#555555] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Ativos
                </th>
                <th className="text-right text-[#555555] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Novos
                </th>
                <th className="text-center text-[#555555] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Integração
                </th>
              </tr>
            </thead>
            <tbody>
              {exec.imobiliarias.map((imob) => (
                <tr
                  key={imob.id}
                  className="border-b border-[#1A1A1A] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#1A1A1A] flex items-center justify-center text-xs font-bold text-[#888888]">
                        {imob.iniciais}
                      </div>
                      <div>
                        <span className="text-white font-medium">
                          {imob.nome}
                        </span>
                        {imob.novaNoPeríodo && (
                          <span className="ml-2 text-[9px] font-bold uppercase text-[#00CC44] bg-[#00CC44]/10 px-1.5 py-0.5 rounded">
                            nova
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    {imob.totalCorretores}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    {imob.corretoresAtivos}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[#00CC44] font-medium">
                      +{imob.novosCorretores}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        imob.integrada
                          ? "bg-[#00CC44]/10 text-[#00CC44]"
                          : "bg-[#333333]/30 text-[#555555]"
                      }`}
                    >
                      {imob.integrada ? "integrada" : "não integrada"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
