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

  return (
    <div>
      <Link href="/membros" className="text-sm text-accent-dark hover:underline">
        ← Meus cursos
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-brand">{course.title}</h1>
      <p className="mt-1 text-sm text-foreground/60">{course.description}</p>

      {firstLesson && (
        <Link
          href={`/membros/aula/${firstLesson.id}`}
          className="mt-5 inline-block rounded-md bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-dark"
        >
          {course.modules[0]!.lessons[0] === firstLesson ? "Começar curso" : "Continuar"}
        </Link>
      )}

      <div className="mt-8 space-y-4">
        {course.modules.map((mod, i) => (
          <div key={mod.id} className="overflow-hidden rounded-lg border border-black/10 bg-white">
            <div className="bg-brand/5 px-5 py-3">
              <h2 className="font-semibold text-brand">
                Módulo {i + 1}: {mod.title}
              </h2>
            </div>
            <ul className="divide-y divide-black/5">
              {mod.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link
                    href={`/membros/aula/${lesson.id}`}
                    className="flex items-center gap-3 px-5 py-3 text-sm text-foreground/80 hover:bg-brand/5"
                  >
                    <span className="text-accent">▶</span>
                    {lesson.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
