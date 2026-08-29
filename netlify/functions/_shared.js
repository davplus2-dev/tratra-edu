import { randomUUID, createHmac, timingSafeEqual } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const ALLOWED_ORIGINS = new Set([
  "https://tratraedu.com",
  "https://www.tratraedu.com",
  "http://localhost:8080",
]);
const TRATRA_COURSES = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];

export function getAdminServices() {
  const app = getApps()[0] || initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });
  return { auth: getAuth(app), db: getFirestore(app) };
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing Netlify environment variable: ${name}`);
  return value;
}

export function response(body, status = 200, origin = "") {
  const headers = { "Content-Type": "application/json", "Vary": "Origin" };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  }
  return { statusCode: status, headers, body: JSON.stringify(body) };
}

export function options(event) {
  return response({}, 204, event.headers?.origin || event.headers?.Origin || "");
}

export function requestBody(event) {
  try { return event.body ? JSON.parse(event.body) : {}; }
  catch { throw new Error("Invalid JSON request."); }
}

export async function verifyUser(event) {
  const header = event.headers?.authorization || event.headers?.Authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new Error("AUTH_REQUIRED");
  const { auth } = getAdminServices();
  return auth.verifyIdToken(token);
}

export function getProduct(product, courseId) {
  if (product === "single") {
    if (!TRATRA_COURSES.includes(courseId)) throw new Error("Choose a valid Tratra course.");
    return { product: "single", productId: `tratra-single-${courseId}`, courseId, plan: "single", amount: 3000000, currency: "NGN", label: "Tratra Single Course" };
  }
  if (product === "bundle") {
    return { product: "bundle", productId: "tratra-bundle", courseId: "", plan: "bundle", amount: 14850000, currency: "NGN", label: "Tratra All-In-One Bundle" };
  }
  throw new Error("Unsupported Tratra payment option.");
}

export async function initializeTransaction(event) {
  const user = await verifyUser(event);
  const body = requestBody(event);
  const selected = getProduct(String(body.product || "").toLowerCase(), String(body.courseId || ""));
  const email = String(user.email || "").toLowerCase();
  if (!email) throw new Error("The signed-in account has no email address.");
  const secret = requireEnv("PAYSTACK_SECRET_KEY");
  const reference = `TRATRA-${user.uid.slice(0, 8)}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const { db } = getAdminServices();
  await db.collection("tratraPayments").doc(reference).set({
    uid: user.uid,
    name: user.name || user.email || "",
    email,
    productId: selected.productId,
    product: selected.product,
    plan: selected.plan,
    courseId: selected.courseId,
    amount: selected.amount,
    currency: selected.currency,
    reference,
    method: "paystack",
    provider: "paystack",
    status: "initialized",
    createdAt: FieldValue.serverTimestamp(),
  });

  const paystack = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      amount: selected.amount,
      currency: selected.currency,
      reference,
      callback_url: `https://tratraedu.com/.netlify/functions/paystack-callback`,
      metadata: { site: "tratra", uid: user.uid, productId: selected.productId, courseId: selected.courseId },
    }),
  });
  const result = await paystack.json().catch(() => ({}));
  if (!paystack.ok || !result.status || !result.data?.authorization_url) {
    await db.collection("tratraPayments").doc(reference).set({ status: "initialization_failed", providerError: result.message || "Paystack initialization failed" }, { merge: true });
    throw new Error(result.message || "Paystack could not initialize the transaction.");
  }
  await db.collection("tratraPayments").doc(reference).set({ authorizationUrl: result.data.authorization_url }, { merge: true });
  return { reference, authorizationUrl: result.data.authorization_url };
}

export async function verifyTransaction(reference) {
  const secret = requireEnv("PAYSTACK_SECRET_KEY");
  const paystack = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` } });
  const result = await paystack.json().catch(() => ({}));
  if (!paystack.ok || !result.status || !result.data) throw new Error(result.message || "Paystack verification failed.");
  return result.data;
}

export async function fulfillTransaction(reference) {
  const data = await verifyTransaction(reference);
  const { db } = getAdminServices();
  const paymentRef = db.collection("tratraPayments").doc(reference);
  const paymentSnap = await paymentRef.get();
  if (!paymentSnap.exists) throw new Error("Payment record not found.");
  const payment = paymentSnap.data();
  if (data.status !== "success" || data.currency !== payment.currency || Number(data.amount) !== Number(payment.amount) || String(data.customer?.email || "").toLowerCase() !== String(payment.email || "").toLowerCase()) {
    await paymentRef.set({ status: "verification_failed", paystackStatus: data.status || "unknown", verifiedAt: FieldValue.serverTimestamp() }, { merge: true });
    throw new Error("The Paystack transaction did not match the requested payment.");
  }

  if (payment.status === "completed") return { alreadyCompleted: true, payment };
  await db.runTransaction(async (transaction) => {
    const currentSnap = await transaction.get(paymentRef);
    if (currentSnap.data()?.status === "completed") return;
    const accessRef = db.collection("tratraAccess").doc(payment.uid);
    const userRef = db.collection("tratraUsers").doc(payment.uid);
    const accessSnap = await transaction.get(accessRef);
    const existing = accessSnap.exists ? accessSnap.data() : {};
    const courseIds = payment.plan === "bundle" ? TRATRA_COURSES : Array.from(new Set([...(existing.courses || []), payment.courseId])).filter(Boolean);
    transaction.set(accessRef, { uid: payment.uid, bundleAccess: payment.plan === "bundle" || existing.bundleAccess === true, courses: courseIds, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.set(userRef, { status: "approved", plan: payment.plan, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    transaction.set(paymentRef, { status: "completed", paystackStatus: "success", paystackTransactionId: String(data.id || ""), paidAt: data.paid_at || new Date().toISOString(), verifiedAt: FieldValue.serverTimestamp() }, { merge: true });
  });
  return { alreadyCompleted: false, payment: { ...payment, status: "completed" } };
}

export function validWebhookSignature(rawBody, signature) {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export { ALLOWED_ORIGINS };
