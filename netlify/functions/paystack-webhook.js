import { fulfillTransaction, response, validWebhookSignature } from "./_shared.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return response({ received: false }, 405);
  const rawBody = event.body || "";
  const signature = event.headers?.["x-paystack-signature"] || event.headers?.["X-Paystack-Signature"] || "";
  if (!validWebhookSignature(rawBody, signature)) return response({ received: false }, 401);
  try {
    const payload = JSON.parse(rawBody);
    if (payload.event === "charge.success" && payload.data?.reference) await fulfillTransaction(String(payload.data.reference));
    return response({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed", error);
    return response({ received: false }, 400);
  }
}
