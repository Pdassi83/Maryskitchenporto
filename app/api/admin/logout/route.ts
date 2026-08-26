import { ADMIN_COOKIE } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const response = Response.redirect(new URL("/", request.url), 303);
  response.headers.append("set-cookie", `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
  return response;
}
