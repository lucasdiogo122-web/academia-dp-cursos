import "server-only";
import { Resend } from "resend";

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

type SendCredentialsInput = {
  to: string;
  name: string;
  tempPassword: string;
  isNewAccount: boolean;
};

/**
 * Envia e-mail com o link do site e a senha provisória (nova conta criada
 * pelo admin, ou reset forçado). Se RESEND_API_KEY não estiver configurado,
 * não faz nada — o admin usa a senha provisória exibida no painel.
 */
export async function sendCredentialsEmail({
  to,
  name,
  tempPassword,
  isNewAccount,
}: SendCredentialsInput) {
  const client = getClient();
  if (!client) {
    console.warn(
      "RESEND_API_KEY não configurado — e-mail de credenciais não foi enviado."
    );
    return { sent: false as const };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const subject = isNewAccount
    ? "Seu acesso à Academia do Departamento Pessoal"
    : "Sua senha foi redefinida";

  const html = `
    <p>Olá, ${name}!</p>
    <p>${
      isNewAccount
        ? "Sua conta na Academia do Departamento Pessoal foi criada."
        : "Sua senha de acesso foi redefinida por um administrador."
    }</p>
    <p><strong>Link de acesso:</strong> <a href="${siteUrl}/login">${siteUrl}/login</a></p>
    <p><strong>Senha provisória:</strong> ${tempPassword}</p>
    <p>No primeiro acesso você será solicitado a criar uma nova senha.</p>
  `;

  try {
    await client.emails.send({ from, to, subject, html });
    return { sent: true as const };
  } catch (error) {
    console.error("Erro ao enviar e-mail via Resend:", error);
    return { sent: false as const };
  }
}

type SendCertificateReadyInput = {
  to: string;
  name: string;
  courseTitle: string;
  certificateUrl: string;
};

/**
 * Envia e-mail avisando que o aluno concluiu 100% do curso e o certificado
 * já está disponível. Se RESEND_API_KEY não estiver configurado, não faz
 * nada — o aluno ainda pode acessar o certificado normalmente pelo site.
 */
export async function sendCertificateReadyEmail({
  to,
  name,
  courseTitle,
  certificateUrl,
}: SendCertificateReadyInput) {
  const client = getClient();
  if (!client) {
    console.warn(
      "RESEND_API_KEY não configurado — e-mail de certificado não foi enviado."
    );
    return { sent: false as const };
  }

  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

  const html = `
    <p>Parabéns, ${name}!</p>
    <p>Você concluiu 100% das aulas do curso <strong>${courseTitle}</strong>.</p>
    <p>Seu certificado já está disponível:</p>
    <p><a href="${certificateUrl}">${certificateUrl}</a></p>
    <p>Acesse o link, abra o certificado e use "Imprimir" no seu navegador para salvá-lo como PDF.</p>
  `;

  try {
    await client.emails.send({
      from,
      to,
      subject: `Certificado disponível — ${courseTitle}`,
      html,
    });
    return { sent: true as const };
  } catch (error) {
    console.error("Erro ao enviar e-mail de certificado via Resend:", error);
    return { sent: false as const };
  }
}
