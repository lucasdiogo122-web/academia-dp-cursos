import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userHasAccessToCourse } from "@/lib/access";
import PandaVideoPlayer from "@/components/PandaVideoPlayer";

export default async function AulaPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  await connection();
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/membros/aula/${lessonId}`);
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            include: {
              modules: {
                orderBy: { order: "asc" },
                include: { lessons: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
    },
  });
  if (!lesson) notFound();

  const course = lesson.module.course;
  const hasAccess = await userHasAccessToCourse(session.user.id, course.id);
  if (!hasAccess) {
    redirect(`/checkout/${course.slug}`);
  }

  const flatLessons = course.modules.flatMap((m) => m.lessons);
  const currentIndex = flatLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <Link
          href={`/membros/curso/${course.slug}`}
          className="text-sm text-accent-dark hover:underline"
        >
          ← {course.title}
        </Link>

        <div className="mt-3">
          <PandaVideoPlayer videoId={lesson.pandaVideoId} />
        </div>

        <h1 className="mt-5 text-xl font-bold text-brand">{lesson.title}</h1>
        {lesson.description && (
          <p className="mt-2 text-sm text-foreground/70">{lesson.description}</p>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-black/5 pt-4">
          {prevLesson ? (
            <Link
              href={`/membros/aula/${prevLesson.id}`}
              className="text-sm font-medium text-foreground/70 hover:text-brand"
            >
              ← Aula anterior
            </Link>
          ) : (
            <span />
          )}
          {nextLesson && (
            <Link
              href={`/membros/aula/${nextLesson.id}`}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
            >
              Próxima aula →
            </Link>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        {course.modules.map((mod, i) => (
          <div key={mod.id} className="overflow-hidden rounded-lg border border-black/10 bg-white">
            <div className="bg-brand/5 px-4 py-2">
              <h2 className="text-sm font-semibold text-brand">
                {i + 1}. {mod.title}
              </h2>
            </div>
            <ul className="divide-y divide-black/5">
              {mod.lessons.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/membros/aula/${l.id}`}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm ${
                      l.id === lesson.id
                        ? "bg-accent/10 font-medium text-accent-dark"
                        : "text-foreground/75 hover:bg-brand/5"
                    }`}
                  >
                    <span className="text-xs">{l.id === lesson.id ? "▶" : "○"}</span>
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
    </div>
  );
}
