import type { Metadata, Viewport } from "next";
import { VisitasProvider } from "@/lib/visitas-context";

export const metadata: Metadata = {
  title: "DWV — Registro de Visitas",
  description:
    "Check-in e check-out de visitas às imobiliárias por geolocalização",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function VisitasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VisitasProvider>{children}</VisitasProvider>;
}
