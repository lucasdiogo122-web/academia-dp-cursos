import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function TrocarSenhaPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/trocar-senha");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-black/10 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-brand">Crie uma nova senha</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Por segurança, você precisa definir uma nova senha antes de continuar.
        </p>
        <div className="mt-6">
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
