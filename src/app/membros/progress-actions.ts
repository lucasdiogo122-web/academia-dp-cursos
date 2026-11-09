"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { userHasAccessToCourse } from "@/lib/access";
import { sendCertificateReadyEmail } from "@/lib/email";

/**
 * Chamado pelo player quando o evento panda_ended dispara (vídeo assistido
 * até o fim). Marca a aula como concluída para o aluno e, se isso completar
 * 100% do curso, fecha a compra como concluída e dispara o e-mail de
 * certificado disponível.
 */
export async function markLessonWatchedAction(lessonId: string) {
  const session = await auth();
  if (!session?.user) return;
  const userId = session.user.id;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            include: { modules: { include: { lessons: { select: { id: true } } } } },
          },
        },
      },
    },
  });
  if (!lesson) return;

  const course = lesson.module.course;
  const hasAccess = await userHasAccessToCourse(userId, course.id);
  if (!hasAccess) return;

  await prisma.lessonCompletion.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: {},
    create: { userId, lessonId },
  });

  const totalLessons = course.modules.flatMap((m) => m.lessons).length;
  const completedCount = await prisma.lessonCompletion.count({
    where: { userId, lesson: { module: { courseId: course.id } } },
  });

  if (totalLessons > 0 && completedCount >= totalLessons) {
    const purchase = await prisma.purchase.findFirst({
      where: { userId, courseId: course.id, status: "PAID" },
      orderBy: { paidAt: "desc" },
    });

    if (purchase) {
      if (!purchase.completedAt) {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { completedAt: new Date() },
        });
      }

      if (!purchase.certificateEmailSentAt) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
        const result = user
          ? await sendCertificateReadyEmail({
              to: user.email,
              name: user.name,
              courseTitle: course.title,
              certificateUrl: `${siteUrl}/membros/curso/${course.slug}/certificado`,
            })
          : { sent: false as const };

        if (result.sent) {
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: { certificateEmailSentAt: new Date() },
          });
        }
      }
    }
  }

  revalidatePath(`/membros/curso/${course.slug}`);
  revalidatePath(`/membros/aula/${lessonId}`);
}
