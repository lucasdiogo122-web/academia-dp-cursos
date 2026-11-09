import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  deleteCourseAction,
  deleteModuleAction,
  deleteLessonAction,
  deleteLessonFileAction,
} from "../actions";
import CourseForm from "../CourseForm";
import ModuleForm from "./ModuleForm";
import LessonForm from "./LessonForm";
import FileUploadForm from "./FileUploadForm";

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function CursoDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { files: { orderBy: { createdAt: "asc" } } },
          },
        },
      },
    },
  });
  if (!course) notFound();

  return (
    <div>
      <Link href="/admin/cursos" className="text-sm text-accent-dark hover:underline">
        ← Todos os cursos
      </Link>
      <h2 className="mt-2 text-lg font-semibold text-brand">Editar curso</h2>

      <div className="mt-4">
        <CourseForm course={course} />
      </div>

      <form action={deleteCourseAction} className="mt-2">
        <input type="hidden" name="id" value={course.id} />
        <button
          type="submit"
          className="text-xs font-medium text-red-600 hover:underline"
        >
          Excluir curso (e tudo dentro dele)
        </button>
      </form>

      <h2 className="mt-10 text-lg font-semibold text-brand">Módulos e aulas</h2>

      <div className="mt-4 space-y-6">
        {course.modules.map((mod, i) => (
          <div key={mod.id} className="rounded-lg border border-black/10 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground/50">
                  Módulo {i + 1}
                </p>
                <ModuleForm
                  courseId={course.id}
                  moduleData={{ id: mod.id, title: mod.title, order: mod.order }}
                />
              </div>
              <form action={deleteModuleAction}>
                <input type="hidden" name="id" value={mod.id} />
                <input type="hidden" name="courseId" value={course.id} />
                <button
                  type="submit"
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Excluir módulo
                </button>
              </form>
            </div>

            <div className="mt-4 space-y-3 border-t border-black/5 pt-4">
              {mod.lessons.map((lesson) => (
                <div key={lesson.id} className="rounded-md border border-black/10 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <LessonForm
                        courseId={course.id}
                        moduleId={mod.id}
                        lesson={{
                          id: lesson.id,
                          title: lesson.title,
                          description: lesson.description,
                          pandaVideoId: lesson.pandaVideoId,
                          order: lesson.order,
                        }}
                      />
                    </div>
                    <form action={deleteLessonAction}>
                      <input type="hidden" name="id" value={lesson.id} />
                      <input type="hidden" name="courseId" value={course.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Excluir aula
                      </button>
                    </form>
                  </div>

                  <div className="mt-3 space-y-2 border-t border-black/5 pt-3">
                    <p className="text-xs font-medium text-foreground/60">
                      Materiais de apoio
                    </p>
                    {lesson.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-2 rounded-md bg-black/5 px-2.5 py-1.5 text-xs"
                      >
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-brand hover:underline"
                        >
                          📎 {file.name}{" "}
                          <span className="text-foreground/40">
                            ({formatBytes(file.sizeBytes)})
                          </span>
                        </a>
                        <form action={deleteLessonFileAction}>
                          <input type="hidden" name="id" value={file.id} />
                          <input type="hidden" name="courseId" value={course.id} />
                          <button
                            type="submit"
                            className="shrink-0 font-medium text-red-600 hover:underline"
                          >
                            Remover
                          </button>
                        </form>
                      </div>
                    ))}
                    <FileUploadForm courseId={course.id} lessonId={lesson.id} />
                  </div>
                </div>
              ))}

              <details className="rounded-md border border-dashed border-black/15 p-3">
                <summary className="cursor-pointer text-sm font-medium text-accent-dark">
                  + Adicionar aula
                </summary>
                <div className="mt-3">
                  <LessonForm
                    courseId={course.id}
                    moduleId={mod.id}
                    onDoneLabel="Adicionar aula"
                  />
                </div>
              </details>
            </div>
          </div>
        ))}

        <details className="rounded-lg border border-dashed border-black/15 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-accent-dark">
            + Adicionar módulo
          </summary>
          <div className="mt-3">
            <ModuleForm courseId={course.id} onDoneLabel="Adicionar módulo" />
          </div>
        </details>
      </div>
    </div>
  );
}
