import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Há um package-lock.json vazio na pasta acima; sem isso o Next infere a raiz
  // do workspace lá fora e não resolve o tailwindcss no PostCSS.
  turbopack: { root: import.meta.dirname },
  outputFileTracingRoot: import.meta.dirname,

  // O badge de dev do Next fica fixo no canto inferior esquerdo (z-index máximo)
  // e cobre a aba "Mapa" da barra inferior do Registro de Visitas, bloqueando o
  // clique. Num app mobile-first todo canto é usado, então é melhor desligar.
  devIndicators: false,
};

export default nextConfig;
