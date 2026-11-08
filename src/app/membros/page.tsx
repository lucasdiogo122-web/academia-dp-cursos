import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserCourses } from "@/lib/access";

export default async function MembrosPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/membros");
  }
  const courses = await getUserCourses(session.user.id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand">
        Olá, {session.user.name?.split(" ")[0] ?? "aluno"} 👋
      </h1>
      <p className="mt-1 text-sm text-foreground/60">
        Seus cursos com acesso liberado.
      </p>

      {courses.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-black/15 bg-white p-8 text-center">
          <p className="text-foreground/70">
            Nenhum curso liberado ainda. Se você acabou de pagar, aguarde a
            confirmação do Mercado Pago — a liberação é automática.
          </p>
          <Link
            href="/#curso"
            className="mt-4 inline-block text-sm font-medium text-accent-dark hover:underline"
          >
            Ver curso disponível
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {courses.map((course) => {
            const totalLessons = course.modules.reduce(
              (acc, m) => acc + m.lessons.length,
              0
            );
            return (
              <Link
                key={course.id}
                href={`/membros/curso/${course.slug}`}
                className="rounded-lg border border-black/10 bg-white p-5 shadow-sm transition hover:border-accent/40 hover:shadow-md"
              >
                <h2 className="font-semibold text-brand">{course.title}</h2>
                <p className="mt-1 text-sm text-foreground/60">
                  {course.modules.length} módulos · {totalLessons} aulas
                </p>
                <span className="mt-4 inline-block text-sm font-medium text-accent-dark">
                  Continuar assistindo →
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
