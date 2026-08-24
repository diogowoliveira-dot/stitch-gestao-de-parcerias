"use client";

import { useEffect, useRef, useState } from "react";
import MapaVisitas, { type MapaApi, type PontoMapa } from "./MapaVisitas";
import { Botao, Icon } from "./ui";
import { lerPosicao, type Coords } from "@/lib/visitas-types";

/**
 * Seletor de local em tela cheia: o executivo arrasta o mapa até o endereço
 * (mira fixa no centro) ou toca no ponto exato, e confirma para virar um pin.
 */
export default function SeletorLocal({
  centroInicial,
  pontos,
  onConfirmar,
  onCancelar,
}: {
  centroInicial: { lat: number; lng: number };
  pontos: PontoMapa[];
  onConfirmar: (lat: number, lng: number) => void;
  onCancelar: () => void;
}) {
  const mapa = useRef<MapaApi | null>(null);
  const [minhaPos, setMinhaPos] = useState<Coords | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    lerPosicao()
      .then((p) => {
        setMinhaPos(p);
        mapa.current?.irPara(p.lat, p.lng, 17);
      })
      .catch(() => {});
  }, []);

  async function irParaMinhaPosicao() {
    setBuscando(true);
    try {
      const p = await lerPosicao();
      setMinhaPos(p);
      setPin({ lat: p.lat, lng: p.lng });
      mapa.current?.irPara(p.lat, p.lng, 18);
    } catch {
      /* silencioso: o executivo pode marcar manualmente */
    } finally {
      setBuscando(false);
    }
  }

  function confirmar() {
    const alvo = pin ?? mapa.current?.centro() ?? centroInicial;
    onConfirmar(alvo.lat, alvo.lng);
  }

  return (
    <div className="fixed inset-0 z-[2050] bg-black">
      <MapaVisitas
        pontos={pontos}
        minhaPos={minhaPos}
        pinProvisorio={pin}
        centroInicial={centroInicial}
        zoomInicial={16}
        modoAdicionar
        onMapClick={(lat, lng) => setPin({ lat, lng })}
        onPontoClick={() => {}}
        onPinProvisorioMove={(lat, lng) => setPin({ lat, lng })}
        apiRef={mapa}
      />

      {/* Mira central (quando ainda não há pin marcado) */}
      {!pin && (
        <div className="absolute inset-0 z-[900] flex items-center justify-center pointer-events-none">
          <div className="relative -translate-y-3">
            <Icon
              name="add_location_alt"
              size={44}
              className="text-[#ec1313] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
            />
          </div>
        </div>
      )}

      {/* Topo */}
      <header className="absolute top-0 left-0 right-0 z-[910] p-3">
        <div className="bg-[#0a0a0a]/95 backdrop-blur-md border border-[#222] rounded-2xl px-4 py-3 flex items-center gap-3">
          <button
            onClick={onCancelar}
            aria-label="Voltar"
            className="w-9 h-9 rounded-xl bg-[#171717] border border-[#2a2a2a] flex items-center justify-center text-white shrink-0"
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold leading-tight">Marcar no mapa</h2>
            <p className="text-[11px] text-[#7a7a7a] leading-tight">
              {pin
                ? "Arraste o pin para ajustar o ponto exato"
                : "Toque no local ou centralize o mapa na mira"}
            </p>
          </div>
        </div>
      </header>

      {/* Rodapé */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[910] p-3 flex flex-col gap-2"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={irParaMinhaPosicao}
          className="self-end w-12 h-12 rounded-full bg-[#141414] border border-[#2a2a2a] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(0,0,0,0.7)]"
          aria-label="Usar minha localização"
        >
          <Icon
            name={buscando ? "progress_activity" : "my_location"}
            size={22}
            className={buscando ? "animate-spin" : ""}
          />
        </button>
        <Botao full variante="primario" icone="check" onClick={confirmar}>
          Confirmar este local
        </Botao>
      </div>
    </div>
  );
}
