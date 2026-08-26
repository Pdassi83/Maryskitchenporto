import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "mk_admin";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(payload: string) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function adminIsConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}

export function passwordIsValid(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected && safeEqual(password, expected));
}

export function createAdminToken() {
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 12;
  const payload = `admin:${expires}`;
  return `${payload}.${signature(payload)}`;
}

export function adminTokenIsValid(token?: string | null) {
  if (!token || !adminIsConfigured()) return false;
  const separator = token.lastIndexOf(".");
  if (separator < 0) return false;
  const payload = token.slice(0, separator);
  const suppliedSignature = token.slice(separator + 1);
  const [, rawExpires] = payload.split(":");
  const expires = Number(rawExpires);
  return payload.startsWith("admin:")
    && Number.isFinite(expires)
    && expires > Math.floor(Date.now() / 1000)
    && safeEqual(suppliedSignature, signature(payload));
}

export function requestIsAdmin(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE}=`))
    ?.slice(ADMIN_COOKIE.length + 1);
  return adminTokenIsValid(value ? decodeURIComponent(value) : null);
}

export function unauthorized() {
  return Response.json({ error: "Sessão de gestão inválida." }, { status: 401 });
}
