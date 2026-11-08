import Link from "next/link";

export default function PagamentoPendentePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 text-2xl text-yellow-700">
          ⏳
        </div>
        <h1 className="mt-4 text-2xl font-bold text-brand">
          Pagamento em análise
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Recebemos seu pedido e estamos aguardando a confirmação do pagamento
          (comum em boleto). Assim que for aprovado, o curso é liberado
          automaticamente na sua área de membros.
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
