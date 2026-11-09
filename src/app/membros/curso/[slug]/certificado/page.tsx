import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userHasAccessToCourse } from "@/lib/access";
import PrintButton from "./PrintButton";

export default async function CertificadoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connection();
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/membros/curso/${slug}/certificado`);
  }

  const course = await prisma.course.findUnique({
    where: { slug },
    include: { modules: { include: { lessons: { select: { id: true } } } } },
  });
  if (!course) notFound();

  const hasAccess = await userHasAccessToCourse(session.user.id, course.id);
  if (!hasAccess) {
    redirect(`/checkout/${course.slug}`);
  }

  const flatLessons = course.modules.flatMap((m) => m.lessons);
  const completedCount = await prisma.lessonCompletion.count({
    where: { userId: session.user.id, lessonId: { in: flatLessons.map((l) => l.id) } },
  });
  const isComplete = flatLessons.length > 0 && completedCount === flatLessons.length;
  if (!isComplete) {
    redirect(`/membros/curso/${course.slug}`);
  }

  const [user, purchase] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
    prisma.purchase.findFirst({
      where: { userId: session.user.id, courseId: course.id, status: "PAID" },
      orderBy: { paidAt: "desc" },
      select: { id: true, completedAt: true },
    }),
  ]);

  const completedDate = (purchase?.completedAt ?? new Date()).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="print:hidden mb-6 flex items-center justify-between">
        <Link
          href={`/membros/curso/${course.slug}`}
          className="text-sm text-accent-dark hover:underline"
        >
          ← {course.title}
        </Link>
        <PrintButton />
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border-4 border-double border-brand/40 bg-white p-10 text-center shadow-sm print:border-black print:shadow-none">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent-dark">
          Certificado de Conclusão
        </p>
        <p className="mt-8 text-sm text-foreground/60">Certificamos que</p>
        <p className="mt-2 text-3xl font-bold text-brand">{user?.name ?? session.user.name}</p>
        <p className="mt-4 text-sm text-foreground/60">
          concluiu com êxito 100% das aulas do curso
        </p>
        <p className="mt-2 text-xl font-semibold text-brand">{course.title}</p>
        <p className="mt-8 text-sm text-foreground/60">
          {flatLessons.length} aulas concluídas — {completedDate}
        </p>
        {purchase && (
          <p className="mt-6 text-[11px] text-foreground/40">
            Código de verificação: {purchase.id}
          </p>
        )}
      </div>
    </div>
  );
}
