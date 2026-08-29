import { response, verifyUser, verifyTransaction } from "./_shared.js";
import { getAdminServices } from "./_shared.js";

export async function handler(event) {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  if (event.httpMethod !== "POST") return response({ success: false, error: "Method not allowed." }, 405, origin);
  try {
    const user = await verifyUser(event);
    const body = event.body ? JSON.parse(event.body) : {};
    const reference = String(body.reference || "").trim();
    if (!reference) throw new Error("Payment reference is required.");
    const { db } = getAdminServices();
    const paymentSnap = await db.collection("tratraPayments").doc(reference).get();
    if (!paymentSnap.exists || paymentSnap.data().uid !== user.uid) throw new Error("Payment does not belong to the signed-in account.");
    const data = await verifyTransaction(reference);
    return response({ success: true, status: data.status, reference, verified: data.status === "success" }, 200, origin);
  } catch (error) {
    return response({ success: false, error: error.message || "Could not verify payment." }, error.message === "AUTH_REQUIRED" ? 401 : 400, origin);
  }
}
