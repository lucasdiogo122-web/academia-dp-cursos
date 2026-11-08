import Link from "next/link";

export default function PagamentoSucessoPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl text-accent-dark">
          ✓
        </div>
        <h1 className="mt-4 text-2xl font-bold text-brand">Pagamento recebido!</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Estamos confirmando seu pagamento com o Mercado Pago. Isso costuma levar
          só alguns segundos — assim que aprovado, o curso aparece automaticamente
          na sua área de membros.
        </p>
        <Link
          href="/membros"
          className="mt-6 inline-block rounded-md bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Ir para minha área
        </Link>
      </div>
    </main>
  );
}
