"use client";

import { useActionState } from "react";
import { createUserAction } from "../actions";

export default function CreateUserForm({
  courses,
}: {
  courses: { id: string; title: string }[];
}) {
  const [state, action, pending] = useActionState(createUserAction, undefined);

  return (
    <form
      action={action}
      className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 sm:grid-cols-[1.3fr_1.3fr_1fr_auto] sm:items-end"
    >
      <div>
        <label className="block text-xs font-medium text-foreground/60">Nome</label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground/60">E-mail</label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground/60">
          Conceder acesso a
        </label>
        <select
          name="courseId"
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Nenhum curso</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Criando..." : "Adicionar usuário"}
      </button>

      <p className="sm:col-span-4 text-xs text-foreground/50">
        A senha de acesso é gerada automaticamente e a pessoa é obrigada a
        trocá-la no primeiro login.
      </p>

      {state?.error && (
        <p className="sm:col-span-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.success && (
        <div className="sm:col-span-4 rounded-md bg-accent/10 px-3 py-2 text-sm text-accent-dark">
          <p>{state.success}</p>
          <p className="mt-1">
            Senha provisória: <strong>{state.tempPassword}</strong>
            {state.emailSent
              ? " — já enviada por e-mail."
              : " — e-mail não configurado, repasse manualmente."}
          </p>
        </div>
      )}
    </form>
  );
}
