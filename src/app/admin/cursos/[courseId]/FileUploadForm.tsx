"use client";

import { useActionState } from "react";
import { uploadLessonFileAction } from "../actions";

export default function FileUploadForm({
  courseId,
  lessonId,
}: {
  courseId: string;
  lessonId: string;
}) {
  const [state, action, pending] = useActionState(uploadLessonFileAction, undefined);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input
        type="file"
        name="file"
        required
        className="text-xs text-foreground/70 file:mr-2 file:rounded-md file:border-0 file:bg-brand/10 file:px-2 file:py-1 file:text-xs file:font-medium file:text-brand"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-black/15 px-2.5 py-1 text-xs font-medium text-brand hover:border-brand/40 disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar arquivo"}
      </button>
      {state?.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
      {state?.success && <p className="w-full text-xs text-accent-dark">{state.success}</p>}
    </form>
  );
}
