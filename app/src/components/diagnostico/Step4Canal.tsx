"use client";
import { useDiagData } from "@/lib/diagnostico-context";
import { SEGMENTACAO_OPCOES, RELATORIOS_OPCOES } from "@/lib/diagnostico-mock-data";

export default function Step4Canal() {
  const { formState, dispatch } = useDiagData();

  const setField = (field: string, value: unknown) => {
    dispatch({ type: "SET_FIELD", field, value });
  };

  const hasHouse = formState.cargos.some(
    (c) => c.existe && (c.nome.toLowerCase().includes("house") || c.id === "cargo_house")
  );

  const toggleRelatorio = (opt: string) => {
    const current = formState.relatoriosDesejados || [];
    const updated = current.includes(opt)
      ? current.filter((r) => r !== opt)
      : [...current, opt];
    setField("relatoriosDesejados", updated);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <span className="material-symbols-outlined mb-3 block" style={{ fontSize: 40, color: "#ec1313" }}>store</span>
        <h2 className="text-xl font-bold text-white">Canal e Mercado</h2>
        <p className="text-sm mt-1 text-slate-500">Informações sobre canais de venda, segmentação e relatórios.</p>
      </div>

      {/* Share de VGV */}
      <div className="rounded-2xl p-5 bg-[#121212] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ec1313" }}>pie_chart</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Share de VGV por canal</h3>
        </div>

        {hasHouse && (
          <div className="mb-4">
            <label className="text-xs text-slate-400 mb-1.5 block">% do VGV vendido pela House</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={formState.shareHouse ?? ""}
                onChange={(e) => setField("shareHouse", e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0"
                className="w-24 px-3 py-2.5 rounded-lg text-sm text-white text-center outline-none bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>
        )}

        <div className="mb-2">
          <label className="text-xs text-slate-400 mb-1.5 block">% do VGV vendido pelo Canal de Parcerias</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={formState.shareParcerias ?? ""}
              onChange={(e) => setField("shareParcerias", e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0"
              className="w-24 px-3 py-2.5 rounded-lg text-sm text-white text-center outline-none bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
        </div>
      </div>

      {/* Número de imobiliárias parceiras */}
      <div className="rounded-2xl p-5 bg-[#121212] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#8b5cf6" }}>apartment</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Imobiliárias parceiras</h3>
        </div>
        <label className="text-xs text-slate-400 mb-1.5 block">Número de imobiliárias parceiras ativas</label>
        <input
          type="number"
          min={0}
          value={formState.numImobiliarias ?? ""}
          onChange={(e) => setField("numImobiliarias", e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="Ex: 25"
          className="w-32 px-3 py-2.5 rounded-lg text-sm text-white outline-none bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15]"
        />
      </div>

      {/* Segmentação de corretores */}
      <div className="rounded-2xl p-5 bg-[#121212] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#f59e0b" }}>filter_list</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Segmentação dos corretores da base</h3>
        </div>
        <div className="space-y-2">
          {SEGMENTACAO_OPCOES.map((opt) => {
            const selected = formState.segmentacao === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setField("segmentacao", opt.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm ${
                  selected ? "bg-[#f59e0b]/[0.08] border border-[#f59e0b]/30" : "bg-white/[0.02] border border-white/[0.06]"
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  selected ? "bg-[#f59e0b]" : "bg-white/[0.04] border border-white/[0.06]"
                }`}>
                  {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className={selected ? "text-white" : "text-slate-400"}>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Campo descritivo se Sim */}
        {(formState.segmentacao === "sim_parcial" || formState.segmentacao === "sim_total") && (
          <div className="mt-4">
            <label className="text-xs text-slate-400 mb-1.5 block">Descreva como é feita a segmentação</label>
            <textarea
              value={formState.segmentacaoDescritiva || ""}
              onChange={(e) => setField("segmentacaoDescritiva", e.target.value)}
              placeholder="Ex: Classificamos por volume de vendas em Ouro, Prata e Bronze..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4a5f73] outline-none bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15] resize-y"
            />
            <p className="text-[10px] text-slate-600 mt-1">Esta resposta será analisada por IA para gerar insights no BI.</p>
          </div>
        )}
      </div>

      {/* Relatórios desejados */}
      <div className="rounded-2xl p-5 bg-[#121212] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#10b981" }}>assessment</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Relatórios que mais gostaria de ter</h3>
        </div>
        <div className="space-y-2">
          {RELATORIOS_OPCOES.map((opt) => {
            const selected = (formState.relatoriosDesejados || []).includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggleRelatorio(opt)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all text-sm ${
                  selected ? "bg-[#10b981]/[0.06] text-white" : "text-slate-400"
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                  selected ? "bg-[#10b981]" : "bg-white/[0.04] border border-white/[0.06]"
                }`}>
                  {selected && <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>check</span>}
                </div>
                <span className="text-xs leading-relaxed">{opt}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <label className="text-xs text-slate-400 mb-1.5 block">Outros relatórios ou observações</label>
          <textarea
            value={formState.relatoriosDescritivo || ""}
            onChange={(e) => setField("relatoriosDescritivo", e.target.value)}
            placeholder="Descreva outros relatórios que gostaria de ter..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4a5f73] outline-none bg-white/[0.03] border border-white/[0.06] focus:border-white/[0.15] resize-y"
          />
          <p className="text-[10px] text-slate-600 mt-1">Esta resposta será analisada por IA para gerar insights no BI.</p>
        </div>
      </div>

      {/* Tabela Zero - Canal Parcerias */}
      <div className="rounded-2xl p-5 bg-[#121212] border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#ec1313" }}>table_chart</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Tabela Zero</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">O Canal de Parcerias tem acesso à Tabela Zero (pré-lançamento)?</p>
        <div className="flex gap-3">
          <button
            onClick={() => setField("tabelaZeroParcerias", true)}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              formState.tabelaZeroParcerias === true
                ? "bg-[#ec1313]/[0.08] border border-[#ec1313]/30 text-white"
                : "bg-white/[0.02] border border-white/[0.06] text-slate-400"
            }`}
          >
            Sim
          </button>
          <button
            onClick={() => setField("tabelaZeroParcerias", false)}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              formState.tabelaZeroParcerias === false
                ? "bg-[#ec1313]/[0.08] border border-[#ec1313]/30 text-white"
                : "bg-white/[0.02] border border-white/[0.06] text-slate-400"
            }`}
          >
            Não
          </button>
        </div>
      </div>
    </div>
  );
}
