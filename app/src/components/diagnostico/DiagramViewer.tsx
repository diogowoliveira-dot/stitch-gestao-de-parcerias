"use client";
import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";

interface DiagramViewerProps {
  children: ReactNode;
  resetKey?: string;
}

export default function DiagramViewer({ children, resetKey }: DiagramViewerProps) {
  const [scale, setScale] = useState(0.65);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-reset on tab switch
  useEffect(() => {
    setScale(0.65);
    setTranslate({ x: 0, y: 0 });
  }, [resetKey]);

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.2));

  const handleReset = () => {
    setScale(0.65);
    setTranslate({ x: 0, y: 0 });
  };

  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current || !contentRef.current) {
      handleReset();
      return;
    }
    const container = containerRef.current.getBoundingClientRect();
    const svg = contentRef.current.querySelector("svg");
    if (!svg) { handleReset(); return; }

    const svgRect = svg.getBoundingClientRect();
    const naturalW = svgRect.width / scale;
    const naturalH = svgRect.height / scale;

    const fitScale = Math.min(
      (container.width - 40) / naturalW,
      (container.height - 40) / naturalH,
      1.5
    );
    setScale(Math.max(0.2, fitScale));
    setTranslate({ x: 0, y: 0 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  const handleFullscreen = useCallback(() => {
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapperRef.current.requestFullscreen();
    }
  }, []);

  const handleOpenNewTab = useCallback(() => {
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Diagnóstico DWV</title><style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:40px;box-sizing:border-box}svg{max-width:100%;height:auto}</style></head><body>${svgStr}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setScale((s) => Math.min(Math.max(s + delta, 0.2), 3));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [translate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTranslate({
      x: translateStart.current.x + dx,
      y: translateStart.current.y + dy,
    });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const viewportH = isFullscreen ? "100vh" : "80vh";

  return (
    <div
      ref={wrapperRef}
      className="relative w-full rounded-2xl border border-white/[0.06]"
      style={{
        background: "#0a0a0a",
        height: viewportH,
        minHeight: 600,
        ...(isFullscreen ? { borderRadius: 0, border: "none" } : {}),
      }}
    >
      {/* Floating toolbar — top-right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-black/80 backdrop-blur-sm border border-white/[0.1]">
        <button
          onClick={handleOpenNewTab}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.1] text-slate-400 hover:text-white"
          title="Abrir em nova aba"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
        </button>
        <button
          onClick={handleFitToScreen}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.1] text-slate-400 hover:text-white"
          title="Ajustar à tela"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>fit_screen</span>
        </button>
        <button
          onClick={handleFullscreen}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.1] text-slate-400 hover:text-white"
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{isFullscreen ? "fullscreen_exit" : "fullscreen"}</span>
        </button>

        <div className="w-px h-6 bg-white/[0.1] mx-1" />

        <button
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.1] text-slate-400 hover:text-white"
          title="Diminuir zoom"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
        </button>
        <button
          onClick={handleReset}
          className="h-9 px-3 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.1] text-slate-400 hover:text-white text-xs font-bold tabular-nums min-w-[52px]"
          title="Resetar zoom"
        >
          {Math.round(scale * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.1] text-slate-400 hover:text-white"
          title="Aumentar zoom"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
        </button>
      </div>

      {/* Floating hint — bottom-left */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-[11px] text-slate-500 pointer-events-none border border-white/[0.06]">
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_with</span>
        Arraste para mover · Scroll para zoom
      </div>

      {/* Canvas — infinite pan area */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden"
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          ref={contentRef}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "top left",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
            willChange: "transform",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
