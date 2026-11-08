"use client";

import { useActionState } from "react";
import { forcePasswordResetAction } from "../actions";

export default function ForceResetButton({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(forcePasswordResetAction, undefined);

  return (
    <form action={action}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-medium text-brand hover:underline disabled:opacity-60"
      >
        {pending ? "Gerando..." : "Forçar nova senha"}
      </button>
      {state?.userId === userId && (
        <p className="mt-1 max-w-[180px] text-xs text-foreground/60">
          Nova senha: <strong>{state.tempPassword}</strong>
          {state.emailSent ? " (enviada por e-mail)" : " (e-mail não configurado)"}
        </p>
      )}
    </form>
  );
}
