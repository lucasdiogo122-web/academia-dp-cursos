import "server-only";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

function getClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN não configurado. Defina a variável de ambiente com sua chave do Mercado Pago."
    );
  }
  return new MercadoPagoConfig({ accessToken });
}

type CreatePreferenceInput = {
  purchaseId: string;
  courseTitle: string;
  amountCents: number;
  payerEmail: string;
  payerName: string;
};

/**
 * Cria uma Preference do Checkout Pro. O external_reference é o id da nossa
 * Purchase local — é por ele que o webhook encontra qual compra aprovar.
 */
export async function createCheckoutPreference({
  purchaseId,
  courseTitle,
  amountCents,
  payerEmail,
  payerName,
}: CreatePreferenceInput) {
  const client = getClient();
  const preference = new Preference(client);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const response = await preference.create({
    body: {
      items: [
        {
          id: purchaseId,
          title: courseTitle,
          quantity: 1,
          unit_price: amountCents / 100,
          currency_id: "BRL",
        },
      ],
      payer: { name: payerName, email: payerEmail },
      external_reference: purchaseId,
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${siteUrl}/pagamento/sucesso`,
        pending: `${siteUrl}/pagamento/pendente`,
        failure: `${siteUrl}/pagamento/falha`,
      },
      auto_return: "approved",
    },
  });

  return response;
}

export async function getPayment(paymentId: string) {
  const client = getClient();
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}
