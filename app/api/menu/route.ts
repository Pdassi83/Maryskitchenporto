import { getState } from "@/lib/storage";

export async function GET() {
  try {
    const state = await getState();
    const sold = state.orders
      .filter((order) => order.weekKey === state.settings.weekKey && order.status !== "cancelled")
      .reduce((total, order) => total + order.totalDoses, 0);

    return Response.json({
      settings: state.settings,
      dishes: state.dishes.filter((dish) => dish.active).sort((a, b) => a.sortOrder - b.sortOrder),
      sold,
      remaining: Math.max(0, state.settings.stockLimit - sold),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
