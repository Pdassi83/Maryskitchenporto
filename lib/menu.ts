export type MenuDish = {
  id: string;
  name: string;
  description: string;
  allergens: string;
  image: string;
  priceCents: number;
  active: boolean;
  sortOrder: number;
};

export type MenuSettings = {
  weekKey: string;
  weekLabel: string;
  orderDeadline: string;
  deliveryDate: string;
  deliveryWindow: string;
  stockLimit: number;
  kitPriceCents: number;
  ordersOpen: boolean;
};

export const DEFAULT_SETTINGS: MenuSettings = {
  weekKey: "2026-W35",
  weekLabel: "Semana de 31 de agosto",
  orderDeadline: "Sexta-feira, 28 de agosto",
  deliveryDate: "Segunda-feira, 31 de agosto",
  deliveryWindow: "12h30–16h00",
  stockLimit: 100,
  kitPriceCents: 3000,
  ordersOpen: true,
};

export const DEFAULT_MENU: MenuDish[] = [
  {
    id: "lasanha",
    name: "Lasanha à bolonhesa",
    description: "Bolonhesa de soja, espinafres, béchamel e queijo.",
    allergens: "Soja · Glúten · Lacticínios",
    image: "/images/lasanha.png",
    priceCents: 600,
    active: true,
    sortOrder: 1,
  },
  {
    id: "curry",
    name: "South Indian curry",
    description: "Caril de couve-flor e grão, especiarias e arroz basmati.",
    allergens: "Pode conter frutos secos",
    image: "/images/curry.png",
    priceCents: 600,
    active: true,
    sortOrder: 2,
  },
  {
    id: "burritos",
    name: "Burritos",
    description: "Feijão, arroz, pimentos, abacate e queijo.",
    allergens: "Glúten · Lacticínios",
    image: "/images/burritos.png",
    priceCents: 600,
    active: true,
    sortOrder: 3,
  },
  {
    id: "pataniscas",
    name: "Pataniscas de legumes",
    description: "Pataniscas douradas, acompanhadas por arroz de tomate.",
    allergens: "Ovo · Glúten",
    image: "/images/pataniscas.png",
    priceCents: 600,
    active: true,
    sortOrder: 4,
  },
  {
    id: "chilli",
    name: "Chilli mexicano",
    description: "Feijão vermelho, pimentos, tomate, soja, arroz e guacamole.",
    allergens: "Soja",
    image: "/images/chilli.png",
    priceCents: 600,
    active: true,
    sortOrder: 5,
  },
];
