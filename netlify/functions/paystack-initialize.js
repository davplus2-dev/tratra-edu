import { initializeTransaction, options, response } from "./_shared.js";

export async function handler(event) {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  if (event.httpMethod === "OPTIONS") return options(event);
  if (event.httpMethod !== "POST") return response({ success: false, error: "Method not allowed." }, 405, origin);
  try {
    return response({ success: true, ...(await initializeTransaction(event)) }, 200, origin);
  } catch (error) {
    const status = error.message === "AUTH_REQUIRED" ? 401 : error.message.startsWith("Missing Netlify") ? 503 : 400;
    return response({ success: false, error: error.message || "Could not initialize payment." }, status, origin);
  }
}
