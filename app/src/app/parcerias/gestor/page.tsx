"use client";

import { useState } from "react";
import Link from "next/link";
import {
  executivos,
  gestor,
  getCorretoresTotal,
  getCorretoresAtivos,
  getCorretoresNovos,
  getImobiliariasNaoIntegradas,
  getImobiliariasNovas,
  getTotalEventosParticipantes,
  getSemaforoColor,
  getPctAtingimento,
  gerarAlertas,
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
// COMPONENTS
// ——————————————————————————————————————————

function SectionHeader({ title, icon }: { title: string; icon: string }) {
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

function KpiCard({
  label,
  valor,
  colorOverride,
  sublabel,
}: {
  label: string;
  valor: string | number;
  colorOverride?: string;
  sublabel?: string;
}) {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 flex flex-col gap-1">
      <span className="text-[#888888] text-xs font-medium uppercase tracking-wider">
        {label}
      </span>
      <span
        className="text-2xl font-bold"
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
// MAIN PAGE
// ——————————————————————————————————————————
export default function GestorDashboard() {
  const [periodo, setPeriodo] = useState("mes_atual");

  // Consolidado da equipe
  const equipe = executivos.filter((e) =>
    gestor.executivos.includes(e.id)
  );

  const totalPropostas = equipe.reduce((s, e) => s + e.propostas.total, 0);
  const totalAceitas = equipe.reduce((s, e) => s + e.propostas.aceitas, 0);
  const totalRecusadas = equipe.reduce((s, e) => s + e.propostas.recusadas, 0);
  const totalEmAberto = equipe.reduce((s, e) => s + e.propostas.emAberto, 0);
  const totalCorretores = equipe.reduce((s, e) => s + getCorretoresTotal(e), 0);
  const totalCorretoresAtivos = equipe.reduce(
    (s, e) => s + getCorretoresAtivos(e),
    0
  );
  const totalCorretoresNovos = equipe.reduce(
    (s, e) => s + getCorretoresNovos(e),
    0
  );
  const totalImobiliarias = equipe.reduce(
    (s, e) => s + e.imobiliarias.length,
    0
  );
  const totalNaoIntegradas = equipe.reduce(
    (s, e) => s + getImobiliariasNaoIntegradas(e),
    0
  );
  const totalNovasImob = equipe.reduce(
    (s, e) => s + getImobiliariasNovas(e),
    0
  );
  const totalAcessos = equipe.reduce((s, e) => s + e.acessosProdutos, 0);
  const totalVisitas = equipe.reduce((s, e) => s + e.visitas.realizadas, 0);
  const totalAlcancados = equipe.reduce(
    (s, e) => s + e.visitas.corretoresAlcancados,
    0
  );
  const totalEventos = equipe.reduce((s, e) => s + e.eventos.length, 0);
  const totalParticipantes = equipe.reduce(
    (s, e) => s + getTotalEventosParticipantes(e),
    0
  );

  // Ranking sorted by propostas desc
  const ranking = [...equipe].sort(
    (a, b) => b.propostas.total - a.propostas.total
  );

  const alertas = gerarAlertas(equipe);

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
            <span className="text-[#666666] text-sm">
              Gestão de Parcerias
            </span>
          </div>
          <div className="flex items-center gap-4">
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
        {/* HEADER DO GESTOR */}
        <div className="flex items-center gap-5 py-8 border-b border-[#1A1A1A]">
          <div className="w-16 h-16 rounded-full bg-[#CC0000]/10 border-2 border-[#CC0000] flex items-center justify-center">
            <span className="text-[#CC0000] font-bold text-xl">
              {gestor.iniciais}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{gestor.nome}</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#00CC44]/10 text-[#00CC44] border border-[#00CC44]/20">
                {gestor.status}
              </span>
            </div>
            <p className="text-[#888888] text-sm mt-0.5">{gestor.cargo}</p>
            <p className="text-[#555555] text-xs mt-0.5">
              {equipe.length} executivos na equipe
            </p>
          </div>
        </div>

        {/* METAS DA EQUIPE */}
        <SectionHeader title="Metas da Equipe" icon="flag" />
        <div className="grid grid-cols-3 gap-4">
          <MetaCard
            label="Propostas da Equipe"
            atual={totalPropostas}
            meta={gestor.meta.propostas}
          />
          <MetaCard
            label="Corretores Ativos"
            atual={totalCorretoresAtivos}
            meta={gestor.meta.corretoresAtivos}
          />
          <MetaCard
            label="Imobiliárias na Equipe"
            atual={totalImobiliarias}
            meta={gestor.meta.imobiliarias}
          />
        </div>

        {/* CONSOLIDADO DA EQUIPE */}
        <SectionHeader title="Consolidado da Equipe" icon="monitoring" />
        <div className="grid grid-cols-4 gap-4 mb-4">
          <KpiCard
            label="Total Imobiliárias"
            valor={totalImobiliarias}
            sublabel={`${totalNaoIntegradas} não integradas`}
          />
          <KpiCard
            label="Total Corretores"
            valor={totalCorretores}
            sublabel={`${totalCorretoresNovos} novos no período`}
          />
          <KpiCard
            label="Corretores Ativos"
            valor={totalCorretoresAtivos}
            colorOverride={
              SEMAFORO[
                getSemaforoColor(totalCorretoresAtivos, gestor.meta.corretoresAtivos)
              ].text
            }
          />
          <KpiCard
            label="Novas Imobiliárias"
            valor={totalNovasImob}
            colorOverride="#00CC44"
          />
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <KpiCard label="Propostas Geradas" valor={totalPropostas} />
          <KpiCard
            label="Propostas Aceitas"
            valor={totalAceitas}
            colorOverride="#00CC44"
          />
          <KpiCard
            label="Propostas Recusadas"
            valor={totalRecusadas}
            colorOverride="#CC0000"
          />
          <KpiCard
            label="Propostas em Aberto"
            valor={totalEmAberto}
            colorOverride="#FFCC00"
          />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Acessos aos Produtos" valor={totalAcessos} />
          <KpiCard
            label="Visitas Realizadas"
            valor={totalVisitas}
            sublabel={`${totalAlcancados} corretores alcançados`}
          />
          <KpiCard
            label="Eventos Criados"
            valor={totalEventos}
            sublabel={`${totalParticipantes} participantes`}
          />
          <KpiCard label="Novos Corretores" valor={totalCorretoresNovos} colorOverride="#00CC44" />
        </div>

        {/* SIMULADOR DE METAS — EQUIPE */}
        <div className="mt-10">
          <SimuladorMetas
            metaPropostasInicial={gestor.meta.propostas}
            propostasAtuaisInicial={totalPropostas}
            corretoresCarteiraInicial={totalCorretores}
            corretoresAtivosInicial={totalCorretoresAtivos}
          />
        </div>

        {/* RANKING DOS EXECUTIVOS */}
        <SectionHeader title="Ranking dos Executivos" icon="leaderboard" />
        <div className="bg-[#111111] border border-[#222222] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="text-center text-[#555555] text-xs font-medium uppercase tracking-wider px-3 py-3 w-12">
                  #
                </th>
                <th className="text-left text-[#555555] text-xs font-medium uppercase tracking-wider px-4 py-3">
                  Executivo
                </th>
                <th className="text-center text-[#555555] text-xs font-medium uppercase tracking-wider px-3 py-3">
                  Propostas
                </th>
                <th className="text-center text-[#555555] text-xs font-medium uppercase tracking-wider px-3 py-3">
                  Corretores Ativos
                </th>
                <th className="text-center text-[#555555] text-xs font-medium uppercase tracking-wider px-3 py-3">
                  Imobiliárias
                </th>
                <th className="text-left text-[#555555] text-xs font-medium uppercase tracking-wider px-4 py-3 w-52">
                  Meta Propostas
                </th>
                <th className="text-center text-[#555555] text-xs font-medium uppercase tracking-wider px-3 py-3 w-20">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((exec, i) => {
                const pct = getPctAtingimento(
                  exec.propostas.total,
                  exec.meta.propostas
                );
                const semaforo = getSemaforoColor(
                  exec.propostas.total,
                  exec.meta.propostas
                );
                const cor = SEMAFORO[semaforo];
                const corretoresAtivos = getCorretoresAtivos(exec);

                return (
                  <tr
                    key={exec.id}
                    className="border-b border-[#1A1A1A] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* POSIÇÃO */}
                    <td className="px-3 py-4 text-center">
                      <span
                        className={`text-sm font-bold ${
                          i === 0
                            ? "text-[#FFCC00]"
                            : i === 1
                            ? "text-[#C0C0C0]"
                            : i === 2
                            ? "text-[#CD7F32]"
                            : "text-[#555555]"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>

                    {/* EXECUTIVO */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border"
                          style={{
                            backgroundColor: `${cor.bg}10`,
                            borderColor: `${cor.bg}30`,
                            color: cor.text,
                          }}
                        >
                          {exec.iniciais}
                        </div>
                        <div>
                          <span className="text-white font-medium text-sm">
                            {exec.nome}
                          </span>
                          <span className="block text-[#555555] text-[11px]">
                            {exec.imobiliarias.length} imob · {getCorretoresTotal(exec)} corretores
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* PROPOSTAS */}
                    <td className="px-3 py-4 text-center">
                      <span
                        className="text-lg font-bold"
                        style={{ color: cor.text }}
                      >
                        {exec.propostas.total}
                      </span>
                    </td>

                    {/* CORRETORES ATIVOS */}
                    <td className="px-3 py-4 text-center text-white font-medium">
                      {corretoresAtivos}
                    </td>

                    {/* IMOBILIÁRIAS */}
                    <td className="px-3 py-4 text-center text-white font-medium">
                      {exec.imobiliarias.length}
                    </td>

                    {/* BARRA DE PROGRESSO */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-[5px] bg-[#222222] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              backgroundColor: cor.bar,
                            }}
                          />
                        </div>
                        <span
                          className="text-xs font-bold min-w-[36px] text-right"
                          style={{ color: cor.text }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </td>

                    {/* AÇÃO */}
                    <td className="px-3 py-4 text-center">
                      <Link
                        href={`/parcerias/executivo?id=${exec.id}&gestor=true`}
                        className="inline-flex items-center gap-1 text-[#888888] hover:text-[#CC0000] transition-colors text-xs font-medium"
                      >
                        ver
                        <span className="material-symbols-outlined text-sm">
                          arrow_forward
                        </span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ALERTAS AUTOMÁTICOS */}
        <SectionHeader title="Alertas Automáticos" icon="warning" />
        <div className="space-y-3">
          {alertas.map((alerta) => (
            <div
              key={alerta.id}
              className={`bg-[#111111] border rounded-lg p-4 flex items-start gap-3 ${
                alerta.tipo === "critico"
                  ? "border-[#CC0000]/40"
                  : "border-[#FFCC00]/30"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  alerta.tipo === "critico"
                    ? "bg-[#CC0000] animate-pulse"
                    : "bg-[#FFCC00]"
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      alerta.tipo === "critico"
                        ? "bg-[#CC0000]/10 text-[#CC0000]"
                        : "bg-[#FFCC00]/10 text-[#FFCC00]"
                    }`}
                  >
                    {alerta.tipo === "critico" ? "Crítico" : "Atenção"}
                  </span>
                </div>
                <p className="text-white text-sm font-medium">
                  {alerta.titulo}
                </p>
                <p className="text-[#666666] text-xs mt-0.5">
                  {alerta.descricao}
                </p>
              </div>
            </div>
          ))}
          {alertas.length === 0 && (
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-6 text-center">
              <span className="material-symbols-outlined text-[#00CC44] text-3xl mb-2">
                check_circle
              </span>
              <p className="text-[#888888] text-sm">
                Nenhum alerta no período selecionado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
