import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function MembrosLayout({ children }: LayoutProps<"/membros">) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/membros");
  }

  // Lido direto do banco (não do JWT) para pegar na hora um reset de senha
  // forçado pelo admin, mesmo que a sessão já esteja aberta.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true },
  });
  if (user?.mustChangePassword) {
    redirect("/trocar-senha");
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      {children}
    </main>
  );
}
