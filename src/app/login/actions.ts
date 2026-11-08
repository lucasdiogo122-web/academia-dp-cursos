"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const callbackUrl = formData.get("callbackUrl")?.toString() || "/membros";

  // Checado antes do signIn só para decidir o destino do redirecionamento —
  // a senha ainda é validada normalmente dentro do signIn logo abaixo.
  const userRecord = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { mustChangePassword: true },
  });
  const redirectTo = userRecord?.mustChangePassword ? "/trocar-senha" : callbackUrl;

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }
}
