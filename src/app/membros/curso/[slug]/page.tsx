import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userHasAccessToCourse } from "@/lib/access";

export default async function MembrosCursoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connection();
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/membros/curso/${slug}`);
  }

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!course) notFound();

  const hasAccess = await userHasAccessToCourse(session.user.id, course.id);
  if (!hasAccess) {
    redirect(`/checkout/${course.slug}`);
  }

  const firstLesson = course.modules[0]?.lessons[0];

  const flatLessons = course.modules.flatMap((m) => m.lessons);
  const completions = await prisma.lessonCompletion.findMany({
    where: { userId: session.user.id, lessonId: { in: flatLessons.map((l) => l.id) } },
    select: { lessonId: true },
  });
  const completedIds = new Set(completions.map((c) => c.lessonId));
  const totalLessons = flatLessons.length;
  const completedCount = flatLessons.filter((l) => completedIds.has(l.id)).length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isComplete = totalLessons > 0 && completedCount === totalLessons;

  return (
    <div>
      <Link href="/membros" className="text-sm text-accent-dark hover:underline">
        ← Meus cursos
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-brand">{course.title}</h1>
      <p className="mt-1 text-sm text-foreground/60">{course.description}</p>

      <div className="mt-5 max-w-md">
        <div className="flex items-center justify-between text-xs font-medium text-foreground/60">
          <span>Progresso do curso</span>
          <span>
            {completedCount}/{totalLessons} aulas ({progressPct}%)
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {firstLesson && (
          <Link
            href={`/membros/aula/${firstLesson.id}`}
            className="inline-block rounded-md bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-dark"
          >
            {completedCount === 0 ? "Começar curso" : "Continuar"}
          </Link>
        )}
        {isComplete && (
          <Link
            href={`/membros/curso/${course.slug}/certificado`}
            className="inline-flex items-center gap-1.5 rounded-md border border-accent px-5 py-2.5 font-semibold text-accent-dark hover:bg-accent/10"
          >
            🎓 Ver certificado
          </Link>
        )}
      </div>

      <div className="mt-8 space-y-4">
        {course.modules.map((mod, i) => (
          <div key={mod.id} className="overflow-hidden rounded-lg border border-black/10 bg-white">
            <div className="bg-brand/5 px-5 py-3">
              <h2 className="font-semibold text-brand">
                Módulo {i + 1}: {mod.title}
              </h2>
            </div>
            <ul className="divide-y divide-black/5">
              {mod.lessons.map((lesson) => {
                const done = completedIds.has(lesson.id);
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/membros/aula/${lesson.id}`}
                      className="flex items-center gap-3 px-5 py-3 text-sm text-foreground/80 hover:bg-brand/5"
                    >
                      <span className={done ? "text-accent-dark" : "text-accent"}>
                        {done ? "✓" : "▶"}
                      </span>
                      {lesson.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
