import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export type EnrollmentRow = {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  status: "PENDING" | "PAID" | "REJECTED" | "REFUNDED";
  amountCents: number;
  purchasedAt: Date;
  paidAt: Date | null;
  accessExpiresAt: Date | null;
  isActive: boolean;
};

export type AdminStats = {
  totalStudents: number;
  activeAccess: number;
  expiredAccess: number;
  pending: number;
  revenueCents: number;
};

/** Lista todas as compras/inscrições, mais recentes primeiro. */
export async function getAllEnrollments(): Promise<EnrollmentRow[]> {
  await connection();
  const purchases = await prisma.purchase.findMany({
    include: { user: true, course: true },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();

  return purchases.map((p) => {
    const expired = p.accessExpiresAt !== null && p.accessExpiresAt.getTime() <= now;
    return {
      id: p.id,
      studentName: p.user.name,
      studentEmail: p.user.email,
      courseTitle: p.course.title,
      status: p.status,
      amountCents: p.amountCents,
      purchasedAt: p.createdAt,
      paidAt: p.paidAt,
      accessExpiresAt: p.accessExpiresAt,
      isActive: p.status === "PAID" && !expired,
    };
  });
}

/** Calcula os números de resumo do painel a partir das inscrições já carregadas. */
export function computeAdminStats(rows: EnrollmentRow[]): AdminStats {
  const studentEmails = new Set(
    rows.filter((r) => r.status === "PAID").map((r) => r.studentEmail)
  );

  let activeAccess = 0;
  let expiredAccess = 0;
  let pending = 0;
  let revenueCents = 0;

  for (const row of rows) {
    if (row.status === "PAID") {
      revenueCents += row.amountCents;
      if (row.isActive) activeAccess++;
      else expiredAccess++;
    } else if (row.status === "PENDING") {
      pending++;
    }
  }

  return {
    totalStudents: studentEmails.size,
    activeAccess,
    expiredAccess,
    pending,
    revenueCents,
  };
}

const STATUS_LABEL: Record<EnrollmentRow["status"], string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  REJECTED: "Recusado",
  REFUNDED: "Reembolsado",
};

export function enrollmentsToCsv(rows: EnrollmentRow[]): string {
  const header = [
    "Aluno",
    "E-mail",
    "Curso",
    "Status",
    "Valor (R$)",
    "Comprado em",
    "Pago em",
    "Acesso expira em",
    "Ativo",
  ];

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const formatDate = (d: Date | null) => (d ? d.toISOString() : "");

  const lines = rows.map((r) =>
    [
      escape(r.studentName),
      escape(r.studentEmail),
      escape(r.courseTitle),
      escape(STATUS_LABEL[r.status]),
      (r.amountCents / 100).toFixed(2),
      formatDate(r.purchasedAt),
      formatDate(r.paidAt),
      r.accessExpiresAt ? formatDate(r.accessExpiresAt) : "Vitalício",
      r.isActive ? "Sim" : "Não",
    ].join(",")
  );

  return [header.join(","), ...lines].join("\n");
}
