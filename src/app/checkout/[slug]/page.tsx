import { notFound } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CheckoutForm from "./CheckoutForm";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connection();

  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course || !course.published) notFound();

  const session = await auth();

  return (
    <main className="mx-auto flex-1 px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="text-2xl font-bold text-brand">{course.title}</h1>
          <p className="mt-2 text-sm text-foreground/70">{course.description}</p>

          <div className="mt-6 rounded-lg border border-black/10 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">Total</span>
              <span className="text-2xl font-bold text-brand">
                {formatPrice(course.priceCents)}
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-foreground/70">
              <li>✔ Acesso imediato após a confirmação do pagamento</li>
              <li>✔ Pix, boleto ou cartão de crédito</li>
              <li>✔ Acesso pela área de membros, quando e onde quiser</li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-brand">Finalizar compra</h2>
          <p className="mt-1 text-sm text-foreground/60">
            {session?.user
              ? "Confirme os dados abaixo para continuar."
              : "Crie seu acesso para continuar com o pagamento."}
          </p>
          <div className="mt-5">
            <CheckoutForm courseId={course.id} loggedInEmail={session?.user?.email} />
          </div>
        </div>
      </div>
    </main>
  );
}
