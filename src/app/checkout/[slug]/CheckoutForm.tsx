"use client";

import { useActionState } from "react";
import { startCheckout } from "../actions";

export default function CheckoutForm({
  courseId,
  loggedInEmail,
}: {
  courseId: string;
  loggedInEmail?: string | null;
}) {
  const [state, action, pending] = useActionState(startCheckout, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="courseId" value={courseId} />

      {loggedInEmail ? (
        <p className="rounded-md bg-brand/5 px-3 py-2 text-sm text-foreground/70">
          Comprando como <span className="font-medium">{loggedInEmail}</span>
        </p>
      ) : (
        <>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground/80">
              Nome completo
            </label>
            <input
              id="name"
              name="name"
              required
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground/80">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground/80"
            >
              Crie uma senha de acesso
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <p className="mt-1 text-xs text-foreground/50">
              Mínimo de 8 caracteres. Você usará essa senha para acessar as aulas.
            </p>
          </div>
        </>
      )}

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent px-4 py-3 font-semibold text-white shadow-md hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Preparando pagamento..." : "Ir para o pagamento"}
      </button>

      <p className="text-center text-xs text-foreground/50">
        Você será redirecionado ao ambiente seguro do Mercado Pago.
      </p>
    </form>
  );
}
