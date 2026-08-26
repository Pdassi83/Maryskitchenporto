import { requestIsAdmin, unauthorized } from "@/lib/admin-auth";
import { getState, updateState } from "@/lib/storage";
import type { MenuDish, MenuSettings } from "@/lib/menu";

export async function GET(request: Request) {
  if (!requestIsAdmin(request)) return unauthorized();
  try {
    const state = await getState();
    return Response.json({ settings: state.settings, dishes: state.dishes });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro inesperado" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!requestIsAdmin(request)) return unauthorized();
  try {
    const payload = (await request.json()) as { settings?: MenuSettings; dishes?: MenuDish[] };
    if (!payload.settings || !Array.isArray(payload.dishes) || !payload.dishes.length) {
      return Response.json({ error: "Ementa incompleta." }, { status: 400 });
    }
    if (!payload.settings.weekKey?.trim() || !payload.settings.weekLabel?.trim() || payload.settings.stockLimit < 1 || payload.settings.kitPriceCents < 1) {
      return Response.json({ error: "Confirma a semana, o limite e o preço do kit." }, { status: 400 });
    }

    await updateState((state) => {
      state.settings = payload.settings!;
      state.dishes = payload.dishes!
        .filter((dish) => dish.id && dish.name?.trim() && dish.image && dish.priceCents > 0)
        .map((dish, index) => ({ ...dish, name: dish.name.trim(), sortOrder: index + 1 }));
      return true;
    });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Erro inesperado" }, { status: 500 });
  }
}
