"use client";

import { useActionState } from "react";
import { upsertLessonAction } from "../actions";

export default function LessonForm({
  courseId,
  moduleId,
  lesson,
  onDoneLabel,
}: {
  courseId: string;
  moduleId: string;
  lesson?: {
    id: string;
    title: string;
    description: string | null;
    pandaVideoId: string;
    order: number;
  };
  onDoneLabel?: string;
}) {
  const [state, action, pending] = useActionState(upsertLessonAction, undefined);

  return (
    <form action={action} className="space-y-2 rounded-md border border-black/10 bg-brand/5 p-3">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="moduleId" value={moduleId} />
      {lesson?.id && <input type="hidden" name="id" value={lesson.id} />}

      <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
        <input
          name="title"
          defaultValue={lesson?.title}
          required
          placeholder="Título da aula"
          className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <input
          name="pandaVideoId"
          defaultValue={lesson?.pandaVideoId}
          required
          placeholder="ID do vídeo (Panda Video)"
          className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <input
          name="order"
          type="number"
          defaultValue={lesson?.order ?? 0}
          placeholder="Ordem"
          className="rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>
      <textarea
        name="description"
        defaultValue={lesson?.description ?? ""}
        rows={2}
        placeholder="Descrição (opcional)"
        className="w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
      />

      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Salvando..." : onDoneLabel ?? "Salvar aula"}
      </button>
    </form>
  );
}
