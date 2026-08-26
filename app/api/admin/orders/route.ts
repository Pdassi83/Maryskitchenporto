import { requestIsAdmin, unauthorized } from "@/lib/admin-auth";
import { getState, updateState } from "@/lib/storage";

const allowedStatuses = ["received", "awaiting_change_approval", "awaiting_payment", "confirmed", "preparing", "ready", "completed", "cancelled"];

export async function GET(request: Request) {
  if (!requestIsAdmin(request)) return unauthorized();
  try {
    const state = await getState();
    return Response.json({ orders: state.orders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro inesperado" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!requestIsAdmin(request)) return unauthorized();
  try {
    const payload = (await request.json()) as { id?: string; status?: string; paymentStatus?: string };
    if (!payload.id) return Response.json({ error: "Encomenda inválida." }, { status: 400 });
    await updateState((state) => {
      const order = state.orders.find((item) => item.id === payload.id);
      if (!order) throw new Error("Encomenda não encontrada.");
      if (payload.status && allowedStatuses.includes(payload.status)) order.status = payload.status;
      if (payload.paymentStatus && ["pending", "paid"].includes(payload.paymentStatus)) order.paymentStatus = payload.paymentStatus;
      order.updatedAt = new Date().toISOString();
      return order;
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro inesperado" }, { status: 500 });
  }
}
