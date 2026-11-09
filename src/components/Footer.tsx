import { connection } from "next/server";

export default async function Footer() {
  // new Date() muda a cada request: marca o rodapé como dinâmico em vez de
  // deixar o ano "congelado" no HTML pré-renderizado (Cache Components).
  await connection();

  return (
    <footer className="mt-auto border-t border-black/5 bg-white py-8 text-sm text-foreground/60 print:hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p>
          © {new Date().getFullYear()} Academia do Departamento Pessoal. Todos os
          direitos reservados.
        </p>
        <p className="mt-1">
          Este site é um produto educacional independente e não possui vínculo
          com órgãos públicos.
        </p>
      </div>
    </footer>
  );
}
