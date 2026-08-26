"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  CircleDollarSign,
  Download,
  ImagePlus,
  Loader2,
  PackageCheck,
  Plus,
  Save,
  ShoppingBag,
  Trash2,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_MENU, DEFAULT_SETTINGS, type MenuDish, type MenuSettings } from "@/lib/menu";

type OrderItem = { id: number; dishId: string; dishName: string; unitPriceCents: number; quantity: number };
type Order = {
  id: string;
  code: string;
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
  items: OrderItem[];
};

const statusLabels: Record<string, string> = {
  received: "Recebida",
  awaiting_change_approval: "Validar alterações",
  awaiting_payment: "Aguardar pagamento",
  confirmed: "Confirmada",
  preparing: "Em preparação",
  ready: "Pronta",
  completed: "Entregue / recolhida",
  cancelled: "Cancelada",
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<MenuSettings>(DEFAULT_SETTINGS);
  const [menu, setMenu] = useState<MenuDish[]>(DEFAULT_MENU);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/orders").then((response) => {
        if (response.status === 401) window.location.replace("/admin/login");
        return response.json();
      }),
      fetch("/api/admin/menu").then((response) => {
        if (response.status === 401) window.location.replace("/admin/login");
        return response.json();
      }),
    ])
      .then(([orderData, menuData]) => {
        if (orderData.orders) setOrders(orderData.orders);
        if (menuData.settings) setSettings(menuData.settings);
        if (menuData.dishes) setMenu(menuData.dishes);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeOrders = useMemo(() => orders.filter((order) => order.status !== "cancelled"), [orders]);
  const totals = useMemo(() => ({
    orders: activeOrders.length,
    doses: activeOrders.reduce((sum, order) => sum + order.totalDoses, 0),
    revenue: activeOrders.reduce((sum, order) => sum + order.totalCents, 0),
    pending: activeOrders.filter((order) => order.paymentStatus !== "paid").length,
  }), [activeOrders]);

  const production = useMemo(() => {
    const totalsByDish = new Map<string, number>();
    for (const order of activeOrders) {
      for (const item of order.items) totalsByDish.set(item.dishName, (totalsByDish.get(item.dishName) ?? 0) + item.quantity);
    }
    return [...totalsByDish.entries()].sort((a, b) => b[1] - a[1]);
  }, [activeOrders]);

  async function updateOrder(id: string, patch: { status?: string; paymentStatus?: string }) {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, ...patch } : order));
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!response.ok) setNotice("Não foi possível atualizar a encomenda.");
  }

  function editDish(index: number, patch: Partial<MenuDish>) {
    setMenu((current) => current.map((dish, dishIndex) => dishIndex === index ? { ...dish, ...patch } : dish));
  }

  function addDish() {
    setMenu((current) => [...current, {
      id: `dish-${crypto.randomUUID()}`,
      name: "Novo prato",
      description: "",
      allergens: "",
      image: "/images/lasanha.png",
      priceCents: 600,
      active: true,
      sortOrder: current.length + 1,
    }]);
  }

  async function uploadPhoto(index: number, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setNotice("A enviar fotografia…");
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/admin/upload", { method: "POST", body });
    const data = await response.json();
    if (!response.ok) {
      setNotice(data.error ?? "Não foi possível enviar a fotografia.");
      return;
    }
    editDish(index, { image: data.image });
    setNotice("Fotografia pronta. Guarda a ementa para publicar.");
  }

  async function saveMenu() {
    setSaving(true);
    setNotice("");
    const response = await fetch("/api/admin/menu", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ settings, dishes: menu }),
    });
    const data = await response.json();
    setSaving(false);
    setNotice(response.ok ? "Ementa guardada com sucesso." : data.error ?? "Não foi possível guardar.");
  }

  function exportOrders() {
    const rows = [
      ["Código", "Cliente", "Telefone", "Email", "Doses", "Total", "Entrega/Recolha", "Morada", "Pagamento", "Estado", "Notas"],
      ...orders.map((order) => [
        order.code,
        order.customerName,
        order.phone,
        order.email,
        String(order.totalDoses),
        (order.totalCents / 100).toFixed(2),
        order.fulfilment,
        order.address ?? "",
        order.paymentMethod,
        statusLabels[order.status] ?? order.status,
        order.notes,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    link.download = "marys-kitchen-encomendas.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          <img src="/images/logo-marys-kitchen.png" alt="" />
          <div><strong>Mary&apos;s Kitchen</strong><span>Painel de gestão</span></div>
        </div>
        <Badge variant="secondary">Beta privada</Badge>
        <div className="admin-topbar-actions">
          <Button asChild variant="outline"><Link href="/"><ArrowLeft /> Ver site</Link></Button>
          <form action="/api/admin/logout" method="post"><Button type="submit" variant="outline">Sair</Button></form>
        </div>
      </header>

      <section className="admin-intro">
        <div><p>Olá, Mary</p><h1>A semana num só lugar.</h1></div>
        <div className="publish-control">
          <div><strong>Ementa publicada</strong><span>Clientes podem encomendar</span></div>
          <Switch checked={settings.ordersOpen} onCheckedChange={(value) => setSettings({ ...settings, ordersOpen: value })} />
        </div>
      </section>

      {notice && <div className="admin-notice"><CheckCircle2 /> {notice}</div>}

      <Tabs defaultValue="orders" className="admin-tabs">
        <TabsList className="admin-tabs-list">
          <TabsTrigger value="orders"><ShoppingBag /> Encomendas</TabsTrigger>
          <TabsTrigger value="production"><ChefHat /> Produção</TabsTrigger>
          <TabsTrigger value="menu"><ImagePlus /> Ementa semanal</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <div className="metric-grid">
            <article><ShoppingBag /><span>Encomendas</span><strong>{totals.orders}</strong></article>
            <article><PackageCheck /><span>Doses</span><strong>{totals.doses}<small> / {settings.stockLimit}</small></strong></article>
            <article><CircleDollarSign /><span>Valor total</span><strong>{(totals.revenue / 100).toFixed(0)} €</strong></article>
            <article><Users /><span>Pagamentos pendentes</span><strong>{totals.pending}</strong></article>
          </div>

          <div className="admin-panel">
            <div className="panel-heading">
              <div><h2>Encomendas</h2><p>{settings.weekLabel}</p></div>
              <Button variant="outline" onClick={exportOrders} disabled={!orders.length}><Download /> Exportar CSV</Button>
            </div>
            {loading ? (
              <div className="admin-loading"><Loader2 className="animate-spin" /> A carregar…</div>
            ) : orders.length === 0 ? (
              <div className="admin-empty"><ShoppingBag /><h3>Ainda não há encomendas</h3><p>As novas encomendas aparecem aqui automaticamente.</p></div>
            ) : (
              <>
              <Table className="orders-table">
                <TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Composição</TableHead><TableHead>Total</TableHead><TableHead>Pagamento</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell><strong>{order.code}</strong><small>{new Date(order.createdAt).toLocaleDateString("pt-PT")}</small></TableCell>
                      <TableCell><strong>{order.customerName}</strong><small>{order.fulfilment === "delivery" ? "Entrega" : "Recolha"} · {order.phone}</small>{order.notes && <em>{order.notes}</em>}</TableCell>
                      <TableCell><div className="order-items">{order.items.map((item) => <span key={item.id}>{item.quantity}× {item.dishName}</span>)}</div></TableCell>
                      <TableCell><strong>{(order.totalCents / 100).toFixed(0)} €</strong><small>{order.totalDoses} doses</small></TableCell>
                      <TableCell><button className={order.paymentStatus === "paid" ? "payment-pill paid" : "payment-pill"} onClick={() => updateOrder(order.id, { paymentStatus: order.paymentStatus === "paid" ? "pending" : "paid" })}>{order.paymentStatus === "paid" ? "Pago" : "Pendente"}</button><small>{order.paymentMethod.toUpperCase()}</small></TableCell>
                      <TableCell>
                        <Select value={order.status} onValueChange={(status) => updateOrder(order.id, { status })}>
                          <SelectTrigger className="status-select"><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="orders-mobile">
                {orders.map((order) => (
                  <article key={order.id}>
                    <div className="mobile-order-head"><div><strong>{order.code}</strong><span>{order.customerName}</span></div><b>{(order.totalCents / 100).toFixed(0)} €</b></div>
                    <div className="mobile-order-items">{order.items.map((item) => <span key={item.id}>{item.quantity}× {item.dishName}</span>)}</div>
                    {order.notes && <p className="mobile-order-note">⚠ {order.notes}</p>}
                    <div className="mobile-order-meta"><span>{order.fulfilment === "delivery" ? "Entrega" : "Recolha"}</span><span>{order.totalDoses} doses</span><span>{order.phone}</span></div>
                    <div className="mobile-order-actions">
                      <button className={order.paymentStatus === "paid" ? "payment-pill paid" : "payment-pill"} onClick={() => updateOrder(order.id, { paymentStatus: order.paymentStatus === "paid" ? "pending" : "paid" })}>{order.paymentStatus === "paid" ? "Pago" : "Pendente"}</button>
                      <Select value={order.status} onValueChange={(status) => updateOrder(order.id, { status })}>
                        <SelectTrigger className="status-select"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </article>
                ))}
              </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="production">
          <div className="admin-panel production-panel">
            <div className="panel-heading"><div><h2>Resumo de produção</h2><p>Total automático por prato</p></div><strong>{totals.doses} doses</strong></div>
            {production.length === 0 ? (
              <div className="admin-empty"><ChefHat /><h3>Produção a zero</h3><p>As quantidades aparecem quando entrarem encomendas.</p></div>
            ) : production.map(([name, quantity]) => (
              <div className="production-row" key={name}><span>{name}</span><div><i style={{ width: `${Math.max(8, quantity / totals.doses * 100)}%` }} /></div><strong>{quantity}</strong></div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="menu">
          <div className="menu-admin-grid">
            <aside className="week-settings admin-panel">
              <h2>Definições da semana</h2>
              <label>Nome da semana<Input value={settings.weekLabel} onChange={(event) => setSettings({ ...settings, weekLabel: event.target.value })} /></label>
              <label>Código da semana<Input value={settings.weekKey} onChange={(event) => setSettings({ ...settings, weekKey: event.target.value })} /></label>
              <label>Prazo de encomenda<Input value={settings.orderDeadline} onChange={(event) => setSettings({ ...settings, orderDeadline: event.target.value })} /></label>
              <label>Data de entrega<Input value={settings.deliveryDate} onChange={(event) => setSettings({ ...settings, deliveryDate: event.target.value })} /></label>
              <label>Horário<Input value={settings.deliveryWindow} onChange={(event) => setSettings({ ...settings, deliveryWindow: event.target.value })} /></label>
              <label>Limite total de doses<Input type="number" min="1" value={settings.stockLimit} onChange={(event) => setSettings({ ...settings, stockLimit: Number(event.target.value) })} /></label>
              <label>Preço do kit + entrega (€)<Input type="number" min="1" step="0.5" value={settings.kitPriceCents / 100} onChange={(event) => setSettings({ ...settings, kitPriceCents: Math.round(Number(event.target.value) * 100) })} /></label>
              <Button onClick={saveMenu} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />} Guardar e publicar</Button>
            </aside>

            <section className="dish-editor-list">
              <div className="panel-heading"><div><h2>Pratos da semana</h2><p>Altera texto, preço e fotografia.</p></div><Button variant="outline" onClick={addDish}><Plus /> Adicionar prato</Button></div>
              {menu.map((dish, index) => (
                <article className={dish.active ? "dish-editor" : "dish-editor inactive"} key={dish.id}>
                  <div className="editor-image">
                    <img src={dish.image} alt="" />
                    <label><ImagePlus /> Trocar foto<input type="file" accept="image/*" onChange={(event) => uploadPhoto(index, event)} /></label>
                  </div>
                  <div className="editor-fields">
                    <label>Nome<Input value={dish.name} onChange={(event) => editDish(index, { name: event.target.value })} /></label>
                    <label>Descrição<Textarea value={dish.description} onChange={(event) => editDish(index, { description: event.target.value })} /></label>
                    <label>Alergénios<Input value={dish.allergens} onChange={(event) => editDish(index, { allergens: event.target.value })} /></label>
                  </div>
                  <button className="dish-toggle" onClick={() => editDish(index, { active: !dish.active })}><Trash2 /> {dish.active ? "Retirar" : "Repor"}</button>
                </article>
              ))}
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
