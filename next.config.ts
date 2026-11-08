import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components (prerender parcial) foi desligado de propósito: quase
  // todo este site é dinâmico por natureza (preço, sessão do usuário,
  // controle de acesso ao curso), então o modelo clássico "dinâmico quando
  // necessário" é mais simples de manter do que desenhar boundaries de
  // Suspense para cada pedaço só para habilitar um shell estático.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
