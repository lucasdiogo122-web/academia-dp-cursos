"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutPreference } from "@/lib/mercadopago";
import { checkoutGuestSchema } from "@/lib/validation";

export type CheckoutState = { error?: string } | undefined;

export async function startCheckout(
  _prevState: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const courseId = formData.get("courseId")?.toString();
  if (!courseId) return { error: "Curso inválido." };

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.published) return { error: "Curso não encontrado." };

  const session = await auth();

  let userId: string;
  let userEmail: string;
  let userName: string;

  if (session?.user) {
    userId = session.user.id;
    userEmail = session.user.email!;
    userName = session.user.name ?? userEmail;
  } else {
    const parsed = checkoutGuestSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    }
    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const validPassword = await bcrypt.compare(password, existing.passwordHash);
      if (!validPassword) {
        return {
          error:
            "Este e-mail já tem cadastro. Faça login para continuar com a compra.",
        };
      }
      userId = existing.id;
      userEmail = existing.email;
      userName = existing.name;
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      const created = await prisma.user.create({
        data: { name, email, passwordHash },
      });
      userId = created.id;
      userEmail = created.email;
      userName = created.name;
    }

    await signIn("credentials", { email: userEmail, password, redirect: false });
  }

  const existingPaid = await prisma.purchase.findFirst({
    where: { userId, courseId, status: "PAID" },
  });
  if (existingPaid) {
    redirect(`/membros/curso/${course.slug}`);
  }

  let purchase = await prisma.purchase.findFirst({
    where: { userId, courseId, status: "PENDING" },
  });
  if (!purchase) {
    purchase = await prisma.purchase.create({
      data: {
        userId,
        courseId,
        status: "PENDING",
        amountCents: course.priceCents,
      },
    });
  }

  let initPoint: string;
  try {
    const preference = await createCheckoutPreference({
      purchaseId: purchase.id,
      courseTitle: course.title,
      amountCents: course.priceCents,
      payerEmail: userEmail,
      payerName: userName,
    });

    if (!preference.init_point) {
      throw new Error("missing init_point");
    }

    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { mpPreferenceId: preference.id },
    });

    initPoint = preference.init_point;
  } catch (err) {
    console.error("Erro ao criar preferência no Mercado Pago:", err);
    return {
      error:
        "Não foi possível iniciar o pagamento agora. Verifique a configuração do Mercado Pago e tente novamente em instantes.",
    };
  }

  redirect(initPoint);
}
