import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DWV — Parcerias Dashboard",
  description: "Dashboard de gestão do Canal de Parcerias",
};

export default function ParceriasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
