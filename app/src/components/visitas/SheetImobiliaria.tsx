"use client";

import { useEffect, useState } from "react";
import { Botao, Campo, Icon, Sheet } from "./ui";
import { buscarEndereco, telefoneMask } from "@/lib/visitas-types";

export interface DadosImobiliaria {
  nome: string;
  endereco: string;
  responsavel: { nome: string; telefone: string; email: string };
}

export type AcaoCadastro = "salvar" | "checkin" | "agendar";

export default function SheetImobiliaria({
  pin,
  onSalvar,
  onCancelar,
  modoEdicao,
  inicial,
  acaoDestaque = "checkin",
}: {
  pin: { lat: number; lng: number };
  onSalvar: (dados: DadosImobiliaria, acao: AcaoCadastro) => void;
  onCancelar: () => void;
  modoEdicao?: boolean;
  inicial?: DadosImobiliaria;
  /** Ação principal do rodapé quando é um cadastro novo */
  acaoDestaque?: "checkin" | "agendar";
}) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [respNome, setRespNome] = useState(inicial?.responsavel.nome ?? "");
  const [tel, setTel] = useState(inicial?.responsavel.telefone ?? "");
  const [email, setEmail] = useState(inicial?.responsavel.email ?? "");
  const [endereco, setEndereco] = useState(inicial?.endereco ?? "");
  const [buscandoEndereco, setBuscandoEndereco] = useState(!modoEdicao);
  const [erros, setErros] = useState<Record<string, string>>({});

  // Endereço aproximado do ponto marcado (best-effort)
  useEffect(() => {
    if (modoEdicao) return;
    let vivo = true;
    buscarEndereco(pin.lat, pin.lng)
      .then((e) => {
        if (vivo && e) setEndereco((atual) => atual || e);
      })
      .finally(() => {
        if (vivo) setBuscandoEndereco(false);
      });
    return () => {
      vivo = false;
    };
  }, [pin.lat, pin.lng, modoEdicao]);

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = "Informe o nome da imobiliária.";
    if (!respNome.trim()) e.resp = "Informe o nome do responsável.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = "E-mail inválido.";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function submeter(acao: AcaoCadastro) {
    if (!validar()) return;
    onSalvar(
      {
        nome: nome.trim(),
        endereco: endereco.trim(),
        responsavel: {
          nome: respNome.trim(),
          telefone: tel.trim(),
          email: email.trim(),
        },
      },
      acao
    );
  }

  const destaque =
    acaoDestaque === "agendar"
      ? { label: "Cadastrar e agendar visita", icone: "event_available" }
      : { label: "Cadastrar e fazer check-in", icone: "how_to_reg" };

  return (
    <Sheet
      aberto
      onFechar={onCancelar}
      titulo={modoEdicao ? "Editar imobiliária" : "Nova imobiliária"}
      subtitulo={
        modoEdicao
          ? "Atualize os dados do cadastro"
          : "Arraste o pin no mapa para ajustar o local exato"
      }
      rodape={
        modoEdicao ? (
          <div className="grid grid-cols-2 gap-2">
            <Botao variante="secundario" onClick={onCancelar}>
              Cancelar
            </Botao>
            <Botao variante="primario" icone="save" onClick={() => submeter("salvar")}>
              Salvar
            </Botao>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Botao
              full
              variante="primario"
              icone={destaque.icone}
              onClick={() => submeter(acaoDestaque)}
            >
              {destaque.label}
            </Botao>
            <Botao
              full
              variante="secundario"
              icone="save"
              onClick={() => submeter("salvar")}
            >
              Apenas cadastrar
            </Botao>
          </div>
        )
      }
    >
      <div className="space-y-3.5">
        <Campo
          label="Nome da imobiliária"
          icone="apartment"
          valor={nome}
          onChange={setNome}
          placeholder="Ex.: Lopes Imóveis"
          obrigatorio
          erro={erros.nome}
        />
        <Campo
          label="Responsável"
          icone="person"
          valor={respNome}
          onChange={setRespNome}
          placeholder="Nome do contato principal"
          obrigatorio
          erro={erros.resp}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Campo
            label="Telefone"
            icone="call"
            valor={tel}
            onChange={(v) => setTel(telefoneMask(v))}
            placeholder="(00) 00000-0000"
            inputMode="tel"
          />
          <Campo
            label="E-mail"
            icone="mail"
            valor={email}
            onChange={setEmail}
            placeholder="contato@imobiliaria.com.br"
            tipo="email"
            inputMode="email"
            erro={erros.email}
          />
        </div>
        <Campo
          label={buscandoEndereco ? "Endereço (buscando…)" : "Endereço"}
          icone="location_on"
          valor={endereco}
          onChange={setEndereco}
          placeholder="Rua, número, bairro, cidade"
          multiline
        />
        <div className="flex items-center gap-2 text-[11px] text-[#6a6a6a] bg-[#111] border border-[#1f1f1f] rounded-lg px-3 py-2">
          <Icon name="explore" size={14} />
          Pin em {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
        </div>
      </div>
    </Sheet>
  );
}
