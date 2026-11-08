import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (!session.user.isAdmin) {
    redirect("/membros");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true },
  });
  if (user?.mustChangePassword) {
    redirect("/trocar-senha");
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Painel administrativo
          </p>
          <h1 className="text-2xl font-bold text-brand">Inscritos e acessos</h1>
        </div>
        <Link href="/membros" className="text-sm text-accent-dark hover:underline">
          ← Voltar ao site
        </Link>
      </div>

      <nav className="mb-6 flex gap-4 border-b border-black/10 text-sm font-medium">
        <Link
          href="/admin"
          className="border-b-2 border-transparent px-1 pb-3 text-foreground/70 hover:border-accent hover:text-brand"
        >
          Inscrições
        </Link>
        <Link
          href="/admin/usuarios"
          className="border-b-2 border-transparent px-1 pb-3 text-foreground/70 hover:border-accent hover:text-brand"
        >
          Usuários e acessos
        </Link>
      </nav>

      {children}
    </main>
  );
}
