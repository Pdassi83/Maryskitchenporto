import { getStore } from "@netlify/blobs";

import { DEFAULT_MENU, DEFAULT_SETTINGS, type MenuDish, type MenuSettings } from "@/lib/menu";

export type StoredOrderItem = {
  id: number;
  dishId: string;
  dishName: string;
  unitPriceCents: number;
  quantity: number;
};

export type StoredOrder = {
  id: string;
  code: string;
  weekKey: string;
  customerName: string;
  phone: string;
  email: string;
  fulfilment: string;
  address: string | null;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  notes: string;
  totalCents: number;
  totalDoses: number;
  createdAt: string;
  updatedAt: string;
  items: StoredOrderItem[];
};

export type AppState = {
  settings: MenuSettings;
  dishes: MenuDish[];
  orders: StoredOrder[];
};

const STATE_KEY = "state";

function defaultState(): AppState {
  return {
    settings: { ...DEFAULT_SETTINGS },
    dishes: DEFAULT_MENU.map((dish) => ({ ...dish })),
    orders: [],
  };
}

function stateStore() {
  return getStore({ name: "marys-kitchen-data", consistency: "strong" });
}

export function imageStore() {
  return getStore({ name: "marys-kitchen-images", consistency: "strong" });
}

export async function getState(): Promise<AppState> {
  const entry = await stateStore().get(STATE_KEY, { type: "json", consistency: "strong" });
  return entry ?? defaultState();
}

export async function updateState<T>(
  change: (state: AppState) => T | Promise<T>,
): Promise<{ state: AppState; result: T }> {
  const store = stateStore();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const entry = await store.getWithMetadata(STATE_KEY, { type: "json", consistency: "strong" });
    const state = (entry?.data ?? defaultState()) as AppState;
    const result = await change(state);
    const write = entry?.etag
      ? await store.setJSON(STATE_KEY, state, { onlyIfMatch: entry.etag })
      : await store.setJSON(STATE_KEY, state, { onlyIfNew: true });

    if (write.modified) return { state, result };
  }

  throw new Error("O serviço está ocupado. Tenta novamente dentro de alguns segundos.");
}
