import Link from "next/link";
import { connection } from "next/server";
import { auth } from "@/auth";
import { logoutAction } from "@/app/logout/actions";

export default async function Navbar() {
  // auth() do NextAuth usa crypto internamente; forçamos dinâmico aqui para
  // que a sessão do usuário nunca fique "congelada" no HTML pré-renderizado.
  await connection();
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-sm text-white">
            DP
          </span>
          <span className="text-base">Academia do Departamento Pessoal</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium">
          {session?.user ? (
            <>
              <Link href="/membros" className="text-brand hover:text-accent-dark">
                Minha área
              </Link>
              {session.user.isAdmin && (
                <Link href="/admin" className="text-brand hover:text-accent-dark">
                  Admin
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-black/10 px-3 py-1.5 text-foreground/80 hover:border-black/20"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-foreground/80 hover:text-brand">
                Entrar
              </Link>
              <Link
                href="/#curso"
                className="rounded-md bg-accent px-4 py-2 text-white shadow-sm hover:bg-accent-dark"
              >
                Comprar curso
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
