import { ADMIN_COOKIE, adminIsConfigured, createAdminToken, passwordIsValid } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  if (!adminIsConfigured()) return Response.redirect(new URL("/admin/login?error=setup", request.url), 303);
  if (!passwordIsValid(password)) return Response.redirect(new URL("/admin/login?error=invalid", request.url), 303);

  const response = Response.redirect(new URL("/admin", request.url), 303);
  response.headers.append(
    "set-cookie",
    `${ADMIN_COOKIE}=${encodeURIComponent(createAdminToken())}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`,
  );
  return response;
}
