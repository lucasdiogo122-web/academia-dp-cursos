import Link from "next/link";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-brand">Entrar na minha área</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Acesse com o e-mail e senha criados na compra do curso.
        </p>
        <div className="mt-6">
          <LoginForm callbackUrl={callbackUrl ?? "/membros"} />
        </div>
        <p className="mt-6 text-center text-sm text-foreground/60">
          Ainda não comprou o curso?{" "}
          <Link href="/#curso" className="font-medium text-accent-dark hover:underline">
            Ver oferta
          </Link>
        </p>
      </div>
    </main>
  );
}
