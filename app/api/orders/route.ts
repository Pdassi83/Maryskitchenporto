import { updateState, type StoredOrder } from "@/lib/storage";

type OrderPayload = {
  customer?: { name?: string; phone?: string; email?: string };
  items?: Array<{ dishId?: string; quantity?: number }>;
  fulfilment?: string;
  address?: string;
  payment?: string;
  notes?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class OrderError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as OrderPayload;
    const customerName = payload.customer?.name?.trim() ?? "";
    const phone = payload.customer?.phone?.trim() ?? "";
    const email = payload.customer?.email?.trim().toLowerCase() ?? "";
    const fulfilment = payload.fulfilment === "pickup" ? "pickup" : "delivery";
    const payment = ["mbway", "transfer", "cash"].includes(payload.payment ?? "") ? payload.payment! : "mbway";
    const address = payload.address?.trim() ?? "";
    const notes = payload.notes?.trim().slice(0, 1000) ?? "";

    if (customerName.length < 2 || phone.length < 7 || !emailPattern.test(email)) {
      throw new OrderError("Confirma o nome, telemóvel e email.", 400);
    }
    if (fulfilment === "delivery" && address.length < 5) {
      throw new OrderError("Indica uma morada de entrega na cidade do Porto.", 400);
    }

    const { result } = await updateState((state) => {
      if (!state.settings.ordersOpen) throw new OrderError("As encomendas desta semana já fecharam.", 409);

      const menuMap = new Map(state.dishes.filter((dish) => dish.active).map((dish) => [dish.id, dish]));
      const normalized = new Map<string, number>();
      for (const item of payload.items ?? []) {
        const quantity = Number(item.quantity ?? 0);
        if (!item.dishId || !menuMap.has(item.dishId) || !Number.isInteger(quantity) || quantity < 1) continue;
        normalized.set(item.dishId, (normalized.get(item.dishId) ?? 0) + quantity);
      }
      const selected = [...normalized.entries()].map(([dishId, quantity]) => ({ dish: menuMap.get(dishId)!, quantity }));
      const totalDoses = selected.reduce((total, item) => total + item.quantity, 0);
      if (totalDoses !== 5) throw new OrderError("O kit deve ter exatamente 5 refeições.", 400);

      const sold = state.orders
        .filter((order) => order.weekKey === state.settings.weekKey && order.status !== "cancelled")
        .reduce((total, order) => total + order.totalDoses, 0);
      if (sold + totalDoses > state.settings.stockLimit) {
        throw new OrderError(`Restam apenas ${Math.max(0, state.settings.stockLimit - sold)} doses esta semana.`, 409);
      }

      const id = crypto.randomUUID();
      const code = `MK-${crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
      const now = new Date().toISOString();
      const order: StoredOrder = {
        id,
        code,
        weekKey: state.settings.weekKey,
        customerName,
        phone,
        email,
        fulfilment,
        address: fulfilment === "delivery" ? address : null,
        paymentMethod: payment,
        paymentStatus: "pending",
        status: notes ? "awaiting_change_approval" : "received",
        notes,
        totalCents: state.settings.kitPriceCents,
        totalDoses,
        createdAt: now,
        updatedAt: now,
        items: selected.map((item, index) => ({
          id: index + 1,
          dishId: item.dish.id,
          dishName: item.dish.name,
          unitPriceCents: Math.round(state.settings.kitPriceCents / 5),
          quantity: item.quantity,
        })),
      };
      state.orders.unshift(order);
      return order;
    });

    return Response.json({ code: result.code, totalCents: result.totalCents, totalDoses: result.totalDoses, status: result.status }, { status: 201 });
  } catch (error) {
    const status = error instanceof OrderError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Não foi possível guardar a encomenda.";
    return Response.json({ error: message }, { status });
  }
}
