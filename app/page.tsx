"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  AtSign,
  Check,
  ChevronDown,
  Clock3,
  Leaf,
  MessageCircle,
  Minus,
  PartyPopper,
  Plus,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_MENU, DEFAULT_SETTINGS, type MenuDish, type MenuSettings } from "@/lib/menu";

export default function Home() {
  const [dishes, setDishes] = useState<MenuDish[]>(DEFAULT_MENU);
  const [settings, setSettings] = useState<MenuSettings>(DEFAULT_SETTINGS);
  const [remaining, setRemaining] = useState(DEFAULT_SETTINGS.stockLimit);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState<"cart" | "details" | "success">("cart");
  const [fulfilment, setFulfilment] = useState("delivery");
  const [payment, setPayment] = useState("mbway");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [compactHeader, setCompactHeader] = useState(false);

  useEffect(() => {
    fetch("/api/menu")
      .then((response) => response.json())
      .then((data) => {
        if (data.dishes) setDishes(data.dishes);
        if (data.settings) setSettings(data.settings);
        if (typeof data.remaining === "number") setRemaining(data.remaining);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const handleScroll = () => setCompactHeader(window.scrollY > 42);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const selected = useMemo(
    () =>
      dishes
        .map((dish) => ({ ...dish, quantity: quantities[dish.id] ?? 0 }))
        .filter((dish) => dish.quantity > 0),
    [dishes, quantities],
  );
  const itemCount = selected.reduce((total, dish) => total + dish.quantity, 0);
  const total = settings.kitPriceCents / 100;
  const kitReady = itemCount === 5;
  const canOrder = settings.ordersOpen && remaining >= 5;

  function changeQuantity(id: string, delta: number) {
    setQuantities((current) => ({
      ...current,
      [id]: Math.max(0, Math.min(5, (current[id] ?? 0) + delta)),
    }));
  }

  function openCart() {
    setStep("cart");
    setCartOpen(true);
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accepted) return;
    setSubmitting(true);
    setSubmitError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer: { name: form.get("name"), phone: form.get("phone"), email: form.get("email") },
          items: selected.map((dish) => ({ dishId: dish.id, quantity: dish.quantity })),
          fulfilment,
          address: form.get("address"),
          payment,
          notes: form.get("notes"),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSubmitError(data.error ?? "Não foi possível enviar o pedido.");
        return;
      }
      setOrderCode(data.code);
      setRemaining((current) => Math.max(0, current - itemCount));
      setStep("success");
    } catch {
      setSubmitError("Não foi possível ligar ao serviço. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f3e9] text-[#27372f]">
      <header className={compactHeader ? "site-header compact" : "site-header"}>
        <a className="brand-lockup" href="#inicio" aria-label="Mary's Kitchen — início">
          <img src="/images/logo-marys-kitchen.png" alt="" />
          <span>Mary&apos;s Kitchen</span>
        </a>
        <nav aria-label="Navegação principal">
          <a href="#ementa">Ementa</a>
          <a href="#como-funciona">Como funciona</a>
        </nav>
        <Button className="header-cart" onClick={openCart}>
          <ShoppingBag />
          <span>{itemCount ? `${itemCount}/5 · ${total} €` : "Cesto"}</span>
        </Button>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-image-wrap">
          <picture>
            <source media="(max-width: 900px)" srcSet="/images/entrada-mobile.png" />
            <img
              className="hero-image"
              src="/images/entrada-marys-kitchen.png"
              alt="Tomates e ervas frescas da Mary's Kitchen"
            />
          </picture>
          <div className="hero-image-shade" />
          <p className="hero-photo-note">Comida feita devagar. Semana resolvida.</p>
        </div>
        <div className="hero-copy">
          <p className="eyebrow"><Leaf /> Ementa semanal vegetariana</p>
          <h1>Escolhe hoje.<br />Come bem a semana toda.</h1>
          <p className="hero-lead">
            Monta um kit com cinco refeições caseiras. Podes repetir ou trocar pratos e a entrega no Porto está incluída.
          </p>
          <div className="hero-actions">
            <Button asChild size="lg" className="primary-cta">
              <a href="#ementa">Ver a ementa <ArrowRight /></a>
            </Button>
            <span>Kit de 5 refeições + entrega · {total} €</span>
          </div>
          <p className="beta-notice">Versão de teste — não efetues pagamentos antes da confirmação da Mary.</p>
          <div className="week-strip" aria-label="Calendário semanal">
            <div><strong>Qua.</strong><span>Nova ementa</span></div>
            <div><strong>Sex.</strong><span>{settings.orderDeadline}</span></div>
            <div><strong>Seg.</strong><span>{settings.deliveryWindow}</span></div>
          </div>
          <a className="scroll-cue" href="#ementa">Escolher pratos <ChevronDown /></a>
        </div>
      </section>

      <section className="menu-section" id="ementa">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><Leaf /> Esta semana</p>
            <h2>Monta o teu kit</h2>
            <p>Escolhe exatamente cinco refeições. Podes repetir ou trocar pratos à vontade.</p>
          </div>
          <div className="availability">
            <span><i /> {settings.ordersOpen ? "Encomendas abertas" : "Encomendas fechadas"}</span>
            <strong>{remaining} doses · {Math.floor(remaining / 5)} kits disponíveis</strong>
          </div>
        </div>

        <div className="dish-grid">
          {dishes.map((dish, index) => {
            const quantity = quantities[dish.id] ?? 0;
            return (
              <article className="dish-card" key={dish.id}>
                <div className="dish-image-wrap">
                  <img src={dish.image} alt={dish.name} />
                  <span>#{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="dish-body">
                  <div className="dish-title-row">
                    <h3>{dish.name}</h3>
                    <strong>Incluído</strong>
                  </div>
                  <p>{dish.description}</p>
                  <small>{dish.allergens}</small>
                  <div className="quantity-control" aria-label={`Quantidade de ${dish.name}`}>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => changeQuantity(dish.id, -1)}
                      disabled={quantity === 0 || !canOrder}
                      aria-label={`Retirar uma dose de ${dish.name}`}
                    >
                      <Minus />
                    </Button>
                    <span><b>{quantity}</b><small>doses</small></span>
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => changeQuantity(dish.id, 1)}
                      aria-label={`Adicionar uma dose de ${dish.name}`}
                      disabled={!canOrder || itemCount >= 5}
                    >
                      <Plus />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="how-section" id="como-funciona">
        <div>
          <p className="eyebrow"><Clock3 /> Simples, todas as semanas</p>
          <h2>Da ementa à tua mesa.</h2>
        </div>
        <ol>
          <li><span>1</span><div><strong>Escolhe</strong><p>Combina os pratos e quantidades que quiseres.</p></div></li>
          <li><span>2</span><div><strong>Confirma</strong><p>Indica alergias, morada e forma de pagamento.</p></div></li>
          <li><span>3</span><div><strong>Recebe</strong><p>Segunda-feira, entre as 12h30 e as 16h00.</p></div></li>
        </ol>
      </section>

      <section className="events-section" id="eventos">
        <div className="events-copy">
          <p className="eyebrow"><PartyPopper /> Catering no Porto</p>
          <h2>Também cozinhamos para os teus eventos.</h2>
          <p>
            Comida caseira vegetariana para encontros, celebrações e eventos. Diz-nos o que estás a planear e tratamos de uma proposta à medida.
          </p>
        </div>
        <div className="events-contact">
          <span>Pedidos e informações</span>
          <strong>Fala diretamente com a Mary</strong>
          <a
            className="events-whatsapp"
            href="https://wa.me/351915598049?text=Ol%C3%A1%2C%20gostaria%20de%20pedir%20informa%C3%A7%C3%B5es%20sobre%20catering%20para%20um%20evento."
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle /> Pedir informações
          </a>
          <a className="events-phone" href="tel:+351915598049">915 598 049</a>
        </div>
      </section>

      <section className="follow-section" aria-label="Instagram da Mary's Kitchen">
        <div>
          <AtSign />
          <span>Follow us</span>
        </div>
        <a
          href="https://www.instagram.com/maryskitchen.porto?igsi=MWExd3Vtb2QzeXR4NA=="
          target="_blank"
          rel="noreferrer"
        >
          @maryskitchen.porto <ArrowRight />
        </a>
      </section>

      <footer>
        <img src="/images/logo-marys-kitchen.png" alt="Mary's Kitchen" />
        <p>Veggie meals · Porto</p>
        <a href="/admin">Área de gestão</a>
      </footer>

      {itemCount > 0 && (
        <button className="mobile-cart" onClick={openCart}>
          <span><ShoppingBag /> {itemCount}/5 refeições</span>
          <strong>{total} € <ArrowRight /></strong>
        </button>
      )}

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="cart-sheet w-full sm:max-w-xl">
          {step === "success" ? (
            <div className="success-state">
              <div className="success-icon"><Check /></div>
              <p className="eyebrow">Pedido recebido</p>
              <h2>Obrigada!</h2>
              <p>
                O pedido <strong>{orderCode}</strong> ficou registado. Nesta beta, a Mary confirma-o manualmente pelos contactos indicados.
              </p>
              <div className="success-summary">
                <span>1 kit · {itemCount} refeições</span><strong>{total} €</strong>
              </div>
              <Button className="w-full" size="lg" onClick={() => setCartOpen(false)}>Voltar à ementa</Button>
            </div>
          ) : (
            <>
              <SheetHeader className="cart-header">
                <p className="eyebrow">{step === "cart" ? "A tua seleção" : "Finalizar pedido"}</p>
                <SheetTitle>{step === "cart" ? "O teu kit de 5 refeições" : "Entrega e contacto"}</SheetTitle>
                <SheetDescription>
                  {step === "cart" ? "Confirma as doses antes de continuar." : "Sem registo obrigatório."}
                </SheetDescription>
              </SheetHeader>

              {step === "cart" ? (
                <div className="cart-content">
                  {selected.length === 0 ? (
                    <div className="empty-cart"><ShoppingBag /><p>Ainda não escolheste nenhum prato.</p></div>
                  ) : (
                    <div className="cart-lines">
                      {selected.map((dish) => (
                        <div className="cart-line" key={dish.id}>
                          <img src={dish.image} alt="" />
                          <div><strong>{dish.name}</strong><span>{dish.quantity} {dish.quantity === 1 ? "dose" : "doses"}</span></div>
                          <div className="mini-quantity">
                            <button onClick={() => changeQuantity(dish.id, -1)} aria-label="Retirar"><Minus /></button>
                            <b>{dish.quantity}</b>
                            <button onClick={() => changeQuantity(dish.id, 1)} aria-label="Adicionar"><Plus /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="kit-progress"><span style={{ width: `${itemCount / 5 * 100}%` }} /></div>
                  <p className="kit-progress-copy">{kitReady ? "Kit completo" : `Escolhe mais ${5 - itemCount} ${5 - itemCount === 1 ? "refeição" : "refeições"}`}</p>
                  <div className="cart-total"><span>Kit + entrega</span><strong>{total} €</strong></div>
                  <Button className="w-full" size="lg" disabled={!kitReady} onClick={() => setStep("details")}>Continuar <ArrowRight /></Button>
                  <p className="microcopy">Preço fixo para cinco refeições. Entrega incluída na cidade do Porto.</p>
                </div>
              ) : (
                <form className="checkout-form" onSubmit={submitOrder}>
                  <div className="field-grid">
                    <label>Nome completo<Input name="name" autoComplete="name" required /></label>
                    <label>Telemóvel<Input name="phone" type="tel" autoComplete="tel" required /></label>
                    <label className="full-field">Email<Input name="email" type="email" autoComplete="email" required /></label>
                  </div>

                  <fieldset>
                    <legend>Como queres receber?</legend>
                    <RadioGroup value={fulfilment} onValueChange={setFulfilment} className="choice-grid">
                      <label htmlFor="delivery" className={fulfilment === "delivery" ? "choice active" : "choice"}>
                        <RadioGroupItem id="delivery" value="delivery" /><Truck /><span><b>Entrega</b><small>Porto · incluída</small></span>
                      </label>
                      <label htmlFor="pickup" className={fulfilment === "pickup" ? "choice active" : "choice"}>
                        <RadioGroupItem id="pickup" value="pickup" /><Store /><span><b>Recolha</b><small>Local a combinar</small></span>
                      </label>
                    </RadioGroup>
                  </fieldset>

                  {fulfilment === "delivery" && <label>Morada no Porto<Input name="address" autoComplete="street-address" required /></label>}

                  <fieldset>
                    <legend>Pagamento</legend>
                    <RadioGroup value={payment} onValueChange={setPayment} className="payment-list">
                      {[["mbway", "MB WAY"], ["transfer", "Transferência"], ["cash", "Dinheiro"]].map(([value, label]) => (
                        <label htmlFor={value} key={value} className={payment === value ? "payment active" : "payment"}>
                          <RadioGroupItem id={value} value={value} /><span>{label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </fieldset>

                  <label>Alterações, alergias ou observações<Textarea name="notes" placeholder="Ex.: alergia a frutos secos; sem queijo…" /></label>
                  <p className="allergy-note">Pedidos de alteração ficam sujeitos à confirmação da Mary.</p>
                  {submitError && <p className="submit-error">{submitError}</p>}

                  <label className="terms-row">
                    <Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} />
                    <span>Confirmo os dados e aceito ser contactado sobre esta encomenda.</span>
                  </label>

                  <div className="checkout-actions">
                    <Button type="button" variant="outline" onClick={() => setStep("cart")}>Voltar</Button>
                    <Button type="submit" disabled={!accepted || submitting}>{submitting ? "A enviar…" : `Enviar pedido · ${total} €`}</Button>
                  </div>
                </form>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}
