import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

/** Retorna true se o usuário tem uma compra aprovada (PAID) e dentro do prazo de acesso. */
export async function userHasAccessToCourse(userId: string, courseId: string) {
  await connection();
  const purchase = await prisma.purchase.findFirst({
    where: {
      userId,
      courseId,
      status: "PAID",
      OR: [{ accessExpiresAt: null }, { accessExpiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  });
  return purchase !== null;
}

/**
 * Lista os cursos que o usuário já comprou (status PAID) e cujo acesso ainda
 * não expirou, com módulos e aulas.
 */
export async function getUserCourses(userId: string) {
  await connection();
  const purchases = await prisma.purchase.findMany({
    where: {
      userId,
      status: "PAID",
      OR: [{ accessExpiresAt: null }, { accessExpiresAt: { gt: new Date() } }],
    },
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
    orderBy: { paidAt: "desc" },
  });
  return purchases.map((p) => p.course);
}
