"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type * as LeafletNS from "leaflet";
import "leaflet/dist/leaflet.css";

export interface PontoMapa {
  id: string;
  lat: number;
  lng: number;
  nome: string;
  cor: string;
  /** Texto sob o pin — data da última visita */
  rotulo: string;
  /** Total de visitas realizadas, exibido ao lado do nome */
  visitas: number;
  emVisita: boolean;
}

export interface MapaApi {
  irPara: (lat: number, lng: number, zoom?: number) => void;
  centro: () => { lat: number; lng: number };
  redimensionar: () => void;
}

interface Props {
  pontos: PontoMapa[];
  minhaPos: { lat: number; lng: number; precisao: number | null } | null;
  /** Pin sendo posicionado para um novo cadastro (arrastável) */
  pinProvisorio: { lat: number; lng: number } | null;
  centroInicial: { lat: number; lng: number };
  zoomInicial?: number;
  modoAdicionar: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onPontoClick: (id: string) => void;
  onPinProvisorioMove: (lat: number, lng: number) => void;
  apiRef?: RefObject<MapaApi | null>;
}

export default function MapaVisitas({
  pontos,
  minhaPos,
  pinProvisorio,
  centroInicial,
  zoomInicial = 14,
  modoAdicionar,
  onMapClick,
  onPontoClick,
  onPinProvisorioMove,
  apiRef,
}: Props) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const LRef = useRef<typeof LeafletNS | null>(null);
  const camadaPontos = useRef<LeafletNS.LayerGroup | null>(null);
  const camadaEu = useRef<LeafletNS.LayerGroup | null>(null);
  const markerProvisorio = useRef<LeafletNS.Marker | null>(null);
  // irPara() pode ser chamado (deep link, GPS) antes de o Leaflet carregar
  const alvoPendente = useRef<{ lat: number; lng: number; zoom?: number } | null>(null);
  // O Leaflet entra por import dinâmico: os efeitos de marcadores só podem
  // rodar depois que o mapa existe, senão os pins somem numa carga limpa.
  const [pronto, setPronto] = useState(false);

  // Handlers em ref para o listener do mapa não precisar ser recriado
  const cbs = useRef({ onMapClick, onPontoClick, onPinProvisorioMove });
  cbs.current = { onMapClick, onPontoClick, onPinProvisorioMove };

  // ---------- init ----------
  useEffect(() => {
    let cancelado = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelado || !divRef.current || mapRef.current) return;

      LRef.current = L;
      const map = L.map(divRef.current, {
        center: [centroInicial.lat, centroInicial.lng],
        zoom: zoomInicial,
        zoomControl: false,
        attributionControl: true,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 20,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }
      ).addTo(map);

      // canto esquerdo: o direito é dos botões flutuantes e da atribuição
      L.control.zoom({ position: "bottomleft" }).addTo(map);

      camadaPontos.current = L.layerGroup().addTo(map);
      camadaEu.current = L.layerGroup().addTo(map);

      map.on("click", (e: LeafletNS.LeafletMouseEvent) => {
        cbs.current.onMapClick(e.latlng.lat, e.latlng.lng);
      });

      // Afastado, os rótulos das imobiliárias se sobrepõem — some com eles
      const ajustarRotulos = () => {
        divRef.current?.classList.toggle("mapa--sem-rotulos", map.getZoom() < 14);
      };
      map.on("zoomend", ajustarRotulos);
      ajustarRotulos();

      mapRef.current = map;
      setPronto(true);

      if (alvoPendente.current) {
        const { lat, lng, zoom } = alvoPendente.current;
        alvoPendente.current = null;
        map.setView([lat, lng], zoom ?? map.getZoom());
        ajustarRotulos();
      }
      // o container costuma nascer com altura 0 dentro de flex/sheet
      setTimeout(() => map.invalidateSize(), 0);
    })();

    return () => {
      cancelado = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setPronto(false);
    };
    // init roda uma única vez de propósito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- API imperativa ----------
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      irPara: (lat, lng, zoom) => {
        const map = mapRef.current;
        if (!map) {
          alvoPendente.current = { lat, lng, zoom };
          return;
        }
        map.flyTo([lat, lng], zoom ?? Math.max(map.getZoom(), 16), {
          duration: 0.8,
        });
      },
      centro: () => {
        const c = mapRef.current?.getCenter();
        return c ? { lat: c.lat, lng: c.lng } : centroInicial;
      },
      redimensionar: () => mapRef.current?.invalidateSize(),
    };
  }, [apiRef, centroInicial]);

  // ---------- cursor de "adicionar" ----------
  useEffect(() => {
    const el = mapRef.current?.getContainer();
    if (el) el.style.cursor = modoAdicionar ? "crosshair" : "";
  }, [modoAdicionar]);

  // ---------- pins das imobiliárias ----------
  useEffect(() => {
    const L = LRef.current;
    const camada = camadaPontos.current;
    if (!L || !camada) return;

    camada.clearLayers();

    pontos.forEach((p) => {
      const icon = L.divIcon({
        className: "pin-imob-wrapper",
        html: `
          <div class="pin-imob ${p.emVisita ? "pin-imob--ativo" : ""}" style="--pin:${p.cor}">
            <span class="pin-imob__dot"></span>
          </div>
          <span class="pin-imob__label"><span class="pin-imob__nome">${escapar(p.nome)}<b class="${p.visitas === 0 ? "pin-imob__n pin-imob__n--zero" : "pin-imob__n"}">${p.visitas}</b></span><em>${escapar(p.rotulo)}</em></span>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      L.marker([p.lat, p.lng], { icon, title: p.nome })
        .on("click", () => cbs.current.onPontoClick(p.id))
        .addTo(camada);
    });
  }, [pontos, pronto]);

  // ---------- minha posição ----------
  useEffect(() => {
    const L = LRef.current;
    const camada = camadaEu.current;
    if (!L || !camada) return;

    camada.clearLayers();
    if (!minhaPos) return;

    if (minhaPos.precisao && minhaPos.precisao > 0) {
      L.circle([minhaPos.lat, minhaPos.lng], {
        radius: minhaPos.precisao,
        color: "#3b82f6",
        weight: 1,
        fillColor: "#3b82f6",
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(camada);
    }

    L.marker([minhaPos.lat, minhaPos.lng], {
      interactive: false,
      icon: L.divIcon({
        className: "pin-eu-wrapper",
        html: `<span class="pin-eu"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    }).addTo(camada);
  }, [minhaPos, pronto]);

  // ---------- pin provisório (novo cadastro) ----------
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (!pinProvisorio) {
      if (markerProvisorio.current) {
        markerProvisorio.current.remove();
        markerProvisorio.current = null;
      }
      return;
    }

    if (!markerProvisorio.current) {
      markerProvisorio.current = L.marker(
        [pinProvisorio.lat, pinProvisorio.lng],
        {
          draggable: true,
          autoPan: true,
          icon: L.divIcon({
            className: "pin-novo-wrapper",
            html: `<div class="pin-novo"><span class="material-symbols-outlined">add_location_alt</span></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          }),
        }
      ).addTo(map);

      markerProvisorio.current.on("dragend", () => {
        const ll = markerProvisorio.current?.getLatLng();
        if (ll) cbs.current.onPinProvisorioMove(ll.lat, ll.lng);
      });
    } else {
      markerProvisorio.current.setLatLng([pinProvisorio.lat, pinProvisorio.lng]);
    }
  }, [pinProvisorio, pronto]);

  return <div ref={divRef} className="absolute inset-0 z-0" />;
}

function escapar(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}
