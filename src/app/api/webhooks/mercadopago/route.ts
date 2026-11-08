import { NextRequest, NextResponse } from "next/server";
import {
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from "mercadopago";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/mercadopago";

// Mercado Pago chama esta rota sempre que o status de um pagamento muda.
// Nunca confiamos no corpo da notificação: usamos o id recebido para buscar
// o pagamento de volta na API do Mercado Pago e só então atualizamos a compra.
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id");
  const topic = url.searchParams.get("type") ?? url.searchParams.get("topic");

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (secret) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: req.headers.get("x-signature"),
        xRequestId: req.headers.get("x-request-id"),
        dataId,
        secret,
        toleranceSeconds: 300,
      });
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        console.warn("Webhook Mercado Pago rejeitado:", err.reason);
        return NextResponse.json({ error: "invalid signature" }, { status: 401 });
      }
      throw err;
    }
  } else {
    console.warn(
      "MERCADOPAGO_WEBHOOK_SECRET não configurado — assinatura do webhook não está sendo validada."
    );
  }

  if (topic !== "payment" || !dataId) {
    // Outros tópicos (merchant_order, etc.) são ignorados.
    return NextResponse.json({ received: true });
  }

  try {
    const payment = await getPayment(dataId);
    const purchaseId = payment.external_reference;
    if (!purchaseId) {
      return NextResponse.json({ error: "missing external_reference" }, { status: 400 });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { course: { select: { accessDurationDays: true } } },
    });
    if (!purchase) {
      return NextResponse.json({ error: "purchase not found" }, { status: 404 });
    }

    const statusMap: Record<string, "PAID" | "PENDING" | "REJECTED" | "REFUNDED"> = {
      approved: "PAID",
      pending: "PENDING",
      in_process: "PENDING",
      rejected: "REJECTED",
      refunded: "REFUNDED",
      cancelled: "REJECTED",
      charged_back: "REFUNDED",
    };
    const newStatus = statusMap[payment.status ?? ""] ?? "PENDING";
    const paidAt = newStatus === "PAID" ? new Date() : purchase.paidAt;

    let accessExpiresAt = purchase.accessExpiresAt;
    if (newStatus === "PAID" && paidAt) {
      const days = purchase.course.accessDurationDays;
      accessExpiresAt = days
        ? new Date(paidAt.getTime() + days * 24 * 60 * 60 * 1000)
        : null;
    }

    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: newStatus,
        mpPaymentId: String(payment.id),
        paidAt,
        accessExpiresAt,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook do Mercado Pago:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
