"use client";

import { useState, useEffect, useCallback } from "react";

interface SimuladorProps {
  metaPropostasInicial: number;
  propostasAtuaisInicial: number;
  corretoresCarteiraInicial: number;
  corretoresAtivosInicial: number;
}

const SEMAFORO_META = (pct: number) =>
  pct >= 80 ? "#00CC44" : pct >= 50 ? "#FFCC00" : "#CC0000";

const SEMAFORO_TE = (te: number) =>
  te >= 70 ? "#00CC44" : te >= 40 ? "#FFCC00" : "#CC0000";

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[#888888] text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
        <span className="text-white text-lg font-bold tabular-nums">
          {value}
          {suffix && (
            <span className="text-[#555555] text-xs font-normal ml-1">
              {suffix}
            </span>
          )}
        </span>
      </div>
      <div className="relative h-8 flex items-center">
        <div className="absolute inset-x-0 h-[5px] bg-[#222222] rounded-full" />
        <div
          className="absolute left-0 h-[5px] rounded-full bg-[#CC0000]"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-x-0 w-full h-8 opacity-0 cursor-pointer z-10"
        />
        <div
          className="absolute w-4 h-4 rounded-full bg-[#CC0000] border-2 border-[#FF2222] shadow-[0_0_8px_rgba(204,0,0,0.5)] pointer-events-none transition-[left] duration-75"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
    </div>
  );
}

function MetricBox({
  label,
  valor,
  sufixo,
  cor,
}: {
  label: string;
  valor: string;
  sufixo?: string;
  cor: string;
}) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-3 flex flex-col gap-1">
      <span className="text-[#666666] text-[10px] font-medium uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold" style={{ color: cor }}>
          {valor}
        </span>
        {sufixo && (
          <span className="text-[#555555] text-xs">{sufixo}</span>
        )}
      </div>
    </div>
  );
}

function RotaCard({
  titulo,
  subtitulo,
  icon,
  linhas,
  alerta,
}: {
  titulo: string;
  subtitulo: string;
  icon: string;
  linhas: { label: string; valor: string; cor: string }[];
  alerta?: string;
}) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg p-4 flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-[#CC0000] text-base">
          {icon}
        </span>
        <span className="text-white text-sm font-bold">{titulo}</span>
      </div>
      <p className="text-[#555555] text-[11px] mb-3">{subtitulo}</p>
      <div className="space-y-2">
        {linhas.map((l, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-[#888888] text-xs">{l.label}</span>
            <span className="text-sm font-bold" style={{ color: l.cor }}>
              {l.valor}
            </span>
          </div>
        ))}
      </div>
      {alerta && (
        <div className="mt-3 bg-[#CC0000]/8 border border-[#CC0000]/20 rounded px-3 py-2">
          <p className="text-[#CC0000] text-[11px] leading-relaxed">
            <span className="material-symbols-outlined text-xs align-middle mr-1">
              warning
            </span>
            {alerta}
          </p>
        </div>
      )}
    </div>
  );
}

export default function SimuladorMetas({
  metaPropostasInicial,
  propostasAtuaisInicial,
  corretoresCarteiraInicial,
  corretoresAtivosInicial,
}: SimuladorProps) {
  const [meta, setMeta] = useState(metaPropostasInicial);
  const [propostasAtuais, setPropostasAtuais] = useState(propostasAtuaisInicial);
  const [corretoresCarteira, setCorretoresCarteira] = useState(corretoresCarteiraInicial);
  const [corretoresAtivos, setCorretoresAtivos] = useState(corretoresAtivosInicial);

  // Sync with prop changes (e.g. switching executives)
  useEffect(() => {
    setMeta(metaPropostasInicial);
    setPropostasAtuais(propostasAtuaisInicial);
    setCorretoresCarteira(corretoresCarteiraInicial);
    setCorretoresAtivos(corretoresAtivosInicial);
  }, [metaPropostasInicial, propostasAtuaisInicial, corretoresCarteiraInicial, corretoresAtivosInicial]);

  // Calculations
  const te = corretoresCarteira > 0 ? (corretoresAtivos / corretoresCarteira) * 100 : 0;
  const produtividade = corretoresAtivos > 0 ? propostasAtuais / corretoresAtivos : 0;
  const progressoMeta = meta > 0 ? (propostasAtuais / meta) * 100 : 0;
  const gap = Math.max(0, meta - propostasAtuais);

  // Rota A — Ativar mais corretores
  const corretoresNecessariosA = produtividade > 0 ? Math.ceil(meta / produtividade) : 0;
  const ativacoesNecessarias = Math.max(0, corretoresNecessariosA - corretoresAtivos);
  const inativosDisponiveis = corretoresCarteira - corretoresAtivos;
  const rotaAViavel = ativacoesNecessarias <= inativosDisponiveis;

  // Rota B — Crescer a base
  const corretoresNecessariosB = te > 0 ? Math.ceil(corretoresNecessariosA / (te / 100)) : 0;
  const gapCarteira = Math.max(0, corretoresNecessariosB - corretoresCarteira);

  // Conclusão em linguagem natural
  const gerarConclusao = useCallback(() => {
    if (gap === 0) {
      return "Meta atingida! O executivo já alcançou ou superou a meta de propostas do período.";
    }
    if (produtividade === 0) {
      return "Sem dados de produtividade ainda — nenhum corretor ativo gerou propostas no período. Priorize ativações para gerar as primeiras propostas.";
    }
    if (corretoresAtivos === 0) {
      return "Nenhum corretor ativo na carteira. Todas as propostas precisam vir de novas ativações.";
    }

    const razao = corretoresAtivos > 0 ? Math.round(corretoresAtivos / Math.max(propostasAtuais, 1)) : 0;
    const partes: string[] = [];

    partes.push(
      `A cada ${razao} corretores ativos, o executivo gera ~1 proposta.`
    );
    partes.push(
      `Para atingir ${meta} propostas, precisa de ${corretoresNecessariosA} corretores ativos.`
    );

    if (te > 0) {
      partes.push(
        `Com a TE atual de ${te.toFixed(0)}%, isso requer ${corretoresNecessariosB} corretores na carteira`
      );
    }

    if (rotaAViavel && ativacoesNecessarias > 0) {
      partes.push(
        `— ou seja, +${ativacoesNecessarias} ativações de inativos da carteira atual.`
      );
    } else if (!rotaAViavel) {
      partes.push(
        `— a carteira atual não tem inativos suficientes. São necessários +${gapCarteira} novos cadastros além das ativações.`
      );
    } else {
      partes.push(".");
    }

    return partes.join(" ");
  }, [gap, produtividade, corretoresAtivos, propostasAtuais, meta, corretoresNecessariosA, te, corretoresNecessariosB, rotaAViavel, ativacoesNecessarias, gapCarteira]);

  return (
    <div className="bg-[#111111] border border-[#333333] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1A1A1A] flex items-center gap-2">
        <span className="material-symbols-outlined text-[#CC0000] text-lg">
          calculate
        </span>
        <h3 className="text-[#CC0000] text-xs font-bold uppercase tracking-widest">
          Simulador de Metas de Propostas
        </h3>
        <span className="text-[#333333] text-[10px] ml-auto">
          Fórmula de Aceleração DWV
        </span>
      </div>

      <div className="p-5">
        {/* Sliders */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-6">
          <SliderInput
            label="Meta de Propostas"
            value={meta}
            min={1}
            max={50}
            step={1}
            onChange={setMeta}
            suffix="propostas"
          />
          <SliderInput
            label="Propostas Atuais"
            value={propostasAtuais}
            min={0}
            max={meta}
            step={1}
            onChange={setPropostasAtuais}
          />
          <SliderInput
            label="Corretores na Carteira"
            value={corretoresCarteira}
            min={1}
            max={500}
            step={1}
            onChange={(v) => {
              setCorretoresCarteira(v);
              if (corretoresAtivos > v) setCorretoresAtivos(v);
            }}
          />
          <SliderInput
            label="Corretores Ativos"
            value={corretoresAtivos}
            min={0}
            max={corretoresCarteira}
            step={1}
            onChange={setCorretoresAtivos}
          />
        </div>

        {/* Métricas calculadas */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <MetricBox
            label="Taxa de Engajamento"
            valor={`${te.toFixed(1)}%`}
            cor={SEMAFORO_TE(te)}
          />
          <MetricBox
            label="Produtividade"
            valor={produtividade.toFixed(2)}
            sufixo="prop/corretor"
            cor="#FFFFFF"
          />
          <MetricBox
            label="Progresso da Meta"
            valor={`${progressoMeta.toFixed(0)}%`}
            cor={SEMAFORO_META(progressoMeta)}
          />
          <MetricBox
            label="Gap"
            valor={gap.toString()}
            sufixo={gap === 1 ? "proposta faltante" : "propostas faltantes"}
            cor={gap === 0 ? "#00CC44" : gap <= 3 ? "#FFCC00" : "#CC0000"}
          />
        </div>

        {/* Rotas estratégicas */}
        <div className="flex gap-4 mb-6">
          <RotaCard
            titulo="Rota A — Ativar Corretores"
            subtitulo="Manter produtividade atual, aumentar engajamento"
            icon="group_add"
            linhas={[
              {
                label: "Corretores ativos necessários",
                valor: produtividade > 0 ? corretoresNecessariosA.toString() : "--",
                cor: "#FFFFFF",
              },
              {
                label: "Ativações necessárias",
                valor: produtividade > 0 ? `+${ativacoesNecessarias}` : "--",
                cor: ativacoesNecessarias === 0 ? "#00CC44" : "#FFCC00",
              },
              {
                label: "Inativos disponíveis",
                valor: inativosDisponiveis.toString(),
                cor: rotaAViavel ? "#00CC44" : "#CC0000",
              },
            ]}
            alerta={
              produtividade > 0 && !rotaAViavel
                ? `Carteira atual tem apenas ${inativosDisponiveis} inativos, mas ${ativacoesNecessarias} ativações são necessárias. Rota A sozinha não é viável.`
                : undefined
            }
          />
          <RotaCard
            titulo="Rota B — Expandir Base"
            subtitulo="Manter TE atual, crescer a carteira de corretores"
            icon="trending_up"
            linhas={[
              {
                label: "Carteira necessária",
                valor: te > 0 ? corretoresNecessariosB.toString() : "--",
                cor: "#FFFFFF",
              },
              {
                label: "Gap de carteira",
                valor: te > 0 ? `+${gapCarteira}` : "--",
                cor: gapCarteira === 0 ? "#00CC44" : "#FFCC00",
              },
              {
                label: "TE a manter",
                valor: `${te.toFixed(0)}%`,
                cor: SEMAFORO_TE(te),
              },
            ]}
          />
        </div>

        {/* Conclusão */}
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[#CC0000] text-sm mt-0.5">
              lightbulb
            </span>
            <p className="text-[#AAAAAA] text-sm leading-relaxed">
              {gerarConclusao()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
