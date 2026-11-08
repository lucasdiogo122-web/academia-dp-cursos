import Link from "next/link";

export default function PagamentoFalhaPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-700">
          ✕
        </div>
        <h1 className="mt-4 text-2xl font-bold text-brand">
          Não foi possível concluir o pagamento
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          O pagamento foi recusado ou cancelado. Você pode tentar novamente com
          outro cartão ou forma de pagamento.
        </p>
        <Link
          href="/#curso"
          className="mt-6 inline-block rounded-md bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Tentar novamente
        </Link>
      </div>
    </main>
  );
}
