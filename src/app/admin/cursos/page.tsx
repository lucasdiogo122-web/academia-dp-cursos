import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CourseForm from "./CourseForm";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function CursosPage() {
  const courses = await prisma.course.findMany({
    include: { modules: { include: { lessons: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-brand">Cursos</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {courses.map((course) => {
          const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
          return (
            <Link
              key={course.id}
              href={`/admin/cursos/${course.id}`}
              className="rounded-lg border border-black/10 bg-white p-4 hover:border-accent/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-brand">{course.title}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    course.published
                      ? "bg-accent/10 text-accent-dark"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {course.published ? "Publicado" : "Rascunho"}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground/60">
                {formatPrice(course.priceCents)} · {course.modules.length} módulos ·{" "}
                {totalLessons} aulas
              </p>
            </Link>
          );
        })}
        {courses.length === 0 && (
          <p className="text-sm text-foreground/50">Nenhum curso criado ainda.</p>
        )}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-brand">Criar novo curso</h2>
      <div className="mt-4">
        <CourseForm />
      </div>
    </div>
  );
}
