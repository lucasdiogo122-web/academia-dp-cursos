"use client";

import { useActionState } from "react";
import { upsertCourseAction } from "./actions";

type CourseData = {
  id?: string;
  title?: string;
  description?: string;
  priceCents?: number;
  accessDurationDays?: number | null;
  published?: boolean;
};

export default function CourseForm({ course }: { course?: CourseData }) {
  const [state, action, pending] = useActionState(upsertCourseAction, undefined);

  return (
    <form action={action} className="space-y-4 rounded-lg border border-black/10 bg-white p-5">
      {course?.id && <input type="hidden" name="id" value={course.id} />}

      <div>
        <label className="block text-sm font-medium text-foreground/80">
          Título do curso
        </label>
        <input
          name="title"
          defaultValue={course?.title}
          required
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80">Descrição</label>
        <textarea
          name="description"
          defaultValue={course?.description}
          required
          rows={3}
          className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground/80">
            Preço (R$)
          </label>
          <input
            name="priceReais"
            defaultValue={course?.priceCents ? (course.priceCents / 100).toFixed(2) : ""}
            required
            inputMode="decimal"
            placeholder="297.00"
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80">
            Acesso (dias, vazio = vitalício)
          </label>
          <input
            name="accessDurationDays"
            defaultValue={course?.accessDurationDays ?? ""}
            inputMode="numeric"
            placeholder="365"
            className="mt-1 w-full rounded-md border border-black/15 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground/80">
        <input
          type="checkbox"
          name="published"
          defaultChecked={course?.published ?? true}
          className="h-4 w-4"
        />
        Publicado (visível na landing page)
      </label>

      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Salvando..." : course?.id ? "Salvar curso" : "Criar curso"}
      </button>
    </form>
  );
}
