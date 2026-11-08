"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendCredentialsEmail } from "@/lib/email";

function generateTempPassword() {
  // 12 caracteres, fácil de digitar/ler, mas aleatório o bastante para uma
  // senha provisória que será trocada no primeiro acesso.
  return crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error("Acesso negado.");
  }
}

async function grantCourseAccess(userId: string, courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return;

  const paidAt = new Date();
  const accessExpiresAt = course.accessDurationDays
    ? new Date(paidAt.getTime() + course.accessDurationDays * 24 * 60 * 60 * 1000)
    : null;

  const existing = await prisma.purchase.findFirst({ where: { userId, courseId } });
  if (existing) {
    await prisma.purchase.update({
      where: { id: existing.id },
      data: { status: "PAID", paidAt, accessExpiresAt },
    });
  } else {
    await prisma.purchase.create({
      data: { userId, courseId, status: "PAID", amountCents: 0, paidAt, accessExpiresAt },
    });
  }
}

export type CreateUserState =
  | { error: string; success?: never; tempPassword?: never }
  | { success: string; tempPassword: string; emailSent: boolean; error?: never }
  | undefined;

/**
 * Cria um usuário manualmente com uma senha provisória (gerada
 * automaticamente), já marcada para troca obrigatória no primeiro acesso, e
 * opcionalmente concede acesso a um curso. Envia o link do site e a senha
 * provisória por e-mail (se RESEND_API_KEY estiver configurado).
 */
export async function createUserAction(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  await requireAdmin();

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const courseId = formData.get("courseId")?.toString();

  if (!name || !email) {
    return { error: "Preencha nome e e-mail." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Já existe um usuário cadastrado com esse e-mail." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, mustChangePassword: true },
  });

  if (courseId) {
    await grantCourseAccess(user.id, courseId);
  }

  const { sent } = await sendCredentialsEmail({
    to: email,
    name,
    tempPassword,
    isNewAccount: true,
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  return {
    success: `Usuário ${email} criado.`,
    tempPassword,
    emailSent: sent,
  };
}

/** Concede (ou reativa) o acesso de um usuário a um curso. */
export async function grantAccessAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId")?.toString();
  const courseId = formData.get("courseId")?.toString();
  if (!userId || !courseId) return;

  await grantCourseAccess(userId, courseId);
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
}

/** Cancela a inscrição (revoga o acesso) marcando a compra como REFUNDED. */
export async function cancelAccessAction(formData: FormData) {
  await requireAdmin();
  const purchaseId = formData.get("purchaseId")?.toString();
  if (!purchaseId) return;

  await prisma.purchase.update({
    where: { id: purchaseId },
    data: { status: "REFUNDED" },
  });
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
}

export type ForceResetState =
  | { userId: string; tempPassword: string; emailSent: boolean }
  | undefined;

/**
 * Gera uma nova senha provisória para um usuário que esqueceu a senha,
 * marca para troca obrigatória no próximo login e envia por e-mail.
 */
export async function forcePasswordResetAction(
  _prevState: ForceResetState,
  formData: FormData
): Promise<ForceResetState> {
  await requireAdmin();
  const userId = formData.get("userId")?.toString();
  if (!userId) return undefined;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return undefined;

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });

  const { sent } = await sendCredentialsEmail({
    to: user.email,
    name: user.name,
    tempPassword,
    isNewAccount: false,
  });

  revalidatePath("/admin/usuarios");
  return { userId, tempPassword, emailSent: sent };
}

/** Promove ou remove a permissão de administrador de um usuário. */
export async function toggleAdminAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId")?.toString();
  const makeAdmin = formData.get("makeAdmin")?.toString() === "true";
  if (!userId) return;

  await prisma.user.update({ where: { id: userId }, data: { isAdmin: makeAdmin } });
  revalidatePath("/admin/usuarios");
}
