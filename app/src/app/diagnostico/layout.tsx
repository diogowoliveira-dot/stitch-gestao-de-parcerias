import type { Metadata } from "next";
import { DiagAuthProvider } from "@/lib/diagnostico-context";
import { DiagDataProvider } from "@/lib/diagnostico-context";

export const metadata: Metadata = {
  title: "DWV - Diagnóstico Comercial",
  description: "Diagnóstico Comercial de Incorporadoras - Operadora DWV",
};

export default function DiagnosticoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DiagAuthProvider>
      <DiagDataProvider>{children}</DiagDataProvider>
    </DiagAuthProvider>
  );
}
