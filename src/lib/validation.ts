import { z } from "zod";

export const checkoutGuestSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo."),
  email: z.email("Informe um e-mail válido.").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(72, "Senha muito longa."),
});

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido.").trim().toLowerCase(),
  password: z.string().min(1, "Informe sua senha."),
});
