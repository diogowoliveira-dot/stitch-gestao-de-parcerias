"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import {
  Vendedor,
  Parceiro,
  Indicacao,
  initialVendedores,
  initialParceiros,
  initialIndicacoes,
  COMISSAO_POR_INDICACAO,
  PartnerType,
  ReferralStatus,
} from "./mock-data";

interface DataContextType {
  vendedores: Vendedor[];
  parceiros: Parceiro[];
  indicacoes: Indicacao[];
  // Parceiros
  addParceiro: (p: Omit<Parceiro, "id" | "dataCadastro" | "status">) => void;
  updateParceiro: (id: string, data: Partial<Parceiro>) => void;
  deleteParceiro: (id: string) => void;
  getParceirosDoVendedor: (vendedorId: string) => Parceiro[];
  // Indicações
  addIndicacao: (i: Omit<Indicacao, "id" | "dataIndicacao" | "valorComissao">) => void;
  updateIndicacaoStatus: (id: string, status: ReferralStatus) => void;
  getIndicacoesDoParceiro: (parceiroId: string) => Indicacao[];
  getIndicacoesDoVendedor: (vendedorId: string) => Indicacao[];
  // Portabilidade
  transferirCarteira: (vendedorOrigemId: string, vendedorDestinoId: string) => void;
  // Vendedores
  addVendedor: (v: Omit<Vendedor, "id" | "dataCadastro" | "status">) => void;
  updateVendedor: (id: string, data: Partial<Vendedor>) => void;
  // Stats
  getStatsVendedor: (vendedorId: string) => {
    totalParceiros: number;
    totalIndicacoes: number;
    fechadas: number;
    emNegociacao: number;
    recusadas: number;
    comissaoTotal: number;
  };
  getStatsGeral: () => {
    totalVendedores: number;
    totalParceiros: number;
    totalIndicacoes: number;
    fechadas: number;
    emNegociacao: number;
    recusadas: number;
    comissaoTotal: number;
  };
}

const DataContext = createContext<DataContextType>({} as DataContextType);

export function DataProvider({ children }: { children: ReactNode }) {
  const [vendedores, setVendedores] = useState<Vendedor[]>(initialVendedores);
  const [parceiros, setParceiros] = useState<Parceiro[]>(initialParceiros);
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>(initialIndicacoes);

  // ---- Parceiros ----
  const addParceiro = (p: Omit<Parceiro, "id" | "dataCadastro" | "status">) => {
    const newParceiro: Parceiro = {
      ...p,
      id: `p${Date.now()}`,
      dataCadastro: new Date().toISOString().split("T")[0],
      status: "ativo",
    };
    setParceiros((prev) => [...prev, newParceiro]);
  };

  const updateParceiro = (id: string, data: Partial<Parceiro>) => {
    setParceiros((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  };

  const deleteParceiro = (id: string) => {
    setParceiros((prev) => prev.filter((p) => p.id !== id));
    setIndicacoes((prev) => prev.filter((i) => i.parceiroId !== id));
  };

  const getParceirosDoVendedor = (vendedorId: string) =>
    parceiros.filter((p) => p.vendedorId === vendedorId);

  // ---- Indicações ----
  const addIndicacao = (
    i: Omit<Indicacao, "id" | "dataIndicacao" | "valorComissao">
  ) => {
    const newIndicacao: Indicacao = {
      ...i,
      id: `i${Date.now()}`,
      dataIndicacao: new Date().toISOString().split("T")[0],
      valorComissao: COMISSAO_POR_INDICACAO,
    };
    setIndicacoes((prev) => [...prev, newIndicacao]);
  };

  const updateIndicacaoStatus = (id: string, status: ReferralStatus) => {
    setIndicacoes((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
  };

  const getIndicacoesDoParceiro = (parceiroId: string) =>
    indicacoes.filter((i) => i.parceiroId === parceiroId);

  const getIndicacoesDoVendedor = (vendedorId: string) => {
    const parceiroIds = parceiros
      .filter((p) => p.vendedorId === vendedorId)
      .map((p) => p.id);
    return indicacoes.filter((i) => parceiroIds.includes(i.parceiroId));
  };

  // ---- Portabilidade ----
  const transferirCarteira = (
    vendedorOrigemId: string,
    vendedorDestinoId: string
  ) => {
    setParceiros((prev) =>
      prev.map((p) =>
        p.vendedorId === vendedorOrigemId
          ? { ...p, vendedorId: vendedorDestinoId }
          : p
      )
    );
  };

  // ---- Vendedores ----
  const addVendedor = (v: Omit<Vendedor, "id" | "dataCadastro" | "status">) => {
    const newVendedor: Vendedor = {
      ...v,
      id: `v${Date.now()}`,
      dataCadastro: new Date().toISOString().split("T")[0],
      status: "ativo",
    };
    setVendedores((prev) => [...prev, newVendedor]);
  };

  const updateVendedor = (id: string, data: Partial<Vendedor>) => {
    setVendedores((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...data } : v))
    );
  };

  // ---- Stats ----
  const getStatsVendedor = (vendedorId: string) => {
    const myParceiros = getParceirosDoVendedor(vendedorId);
    const myIndicacoes = getIndicacoesDoVendedor(vendedorId);
    const fechadas = myIndicacoes.filter((i) => i.status === "fechada");
    return {
      totalParceiros: myParceiros.length,
      totalIndicacoes: myIndicacoes.length,
      fechadas: fechadas.length,
      emNegociacao: myIndicacoes.filter((i) => i.status === "em_negociacao").length,
      recusadas: myIndicacoes.filter((i) => i.status === "recusada").length,
      comissaoTotal: fechadas.length * COMISSAO_POR_INDICACAO,
    };
  };

  const getStatsGeral = () => {
    const fechadas = indicacoes.filter((i) => i.status === "fechada");
    return {
      totalVendedores: vendedores.filter((v) => v.status === "ativo").length,
      totalParceiros: parceiros.length,
      totalIndicacoes: indicacoes.length,
      fechadas: fechadas.length,
      emNegociacao: indicacoes.filter((i) => i.status === "em_negociacao").length,
      recusadas: indicacoes.filter((i) => i.status === "recusada").length,
      comissaoTotal: fechadas.length * COMISSAO_POR_INDICACAO,
    };
  };

  return (
    <DataContext.Provider
      value={{
        vendedores,
        parceiros,
        indicacoes,
        addParceiro,
        updateParceiro,
        deleteParceiro,
        getParceirosDoVendedor,
        addIndicacao,
        updateIndicacaoStatus,
        getIndicacoesDoParceiro,
        getIndicacoesDoVendedor,
        transferirCarteira,
        addVendedor,
        updateVendedor,
        getStatsVendedor,
        getStatsGeral,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
