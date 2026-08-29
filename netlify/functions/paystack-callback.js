import { fulfillTransaction } from "./_shared.js";

export async function handler(event) {
  const reference = String(event.queryStringParameters?.reference || event.queryStringParameters?.trxref || "").trim();
  if (!reference) return { statusCode: 302, headers: { Location: "/payment.html?payment=failed" }, body: "" };
  try {
    await fulfillTransaction(reference);
    return { statusCode: 302, headers: { Location: `/payment-success.html?reference=${encodeURIComponent(reference)}` }, body: "" };
  } catch (error) {
    console.error("Paystack callback verification failed", error);
    return { statusCode: 302, headers: { Location: "/payment.html?payment=failed" }, body: "" };
  }
}
