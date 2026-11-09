"use client";

import { useActionState } from "react";
import { upsertModuleAction } from "../actions";

export default function ModuleForm({
  courseId,
  moduleData,
  onDoneLabel,
}: {
  courseId: string;
  moduleData?: { id: string; title: string; order: number };
  onDoneLabel?: string;
}) {
  const [state, action, pending] = useActionState(upsertModuleAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      {moduleData?.id && <input type="hidden" name="id" value={moduleData.id} />}

      <div className="flex-1 min-w-[180px]">
        {!moduleData && (
          <label className="block text-xs font-medium text-foreground/60">
            Título do módulo
          </label>
        )}
        <input
          name="title"
          defaultValue={moduleData?.title}
          required
          placeholder="Título do módulo"
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>
      <div className="w-20">
        {!moduleData && (
          <label className="block text-xs font-medium text-foreground/60">Ordem</label>
        )}
        <input
          name="order"
          type="number"
          defaultValue={moduleData?.order ?? 0}
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Salvando..." : onDoneLabel ?? "Salvar"}
      </button>
      {state?.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
