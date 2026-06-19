import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useMemo, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPrints } from "@/lib/prints.functions";
import { X, ShoppingBag, ChevronLeft, ChevronRight, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Escolha sua estampa! San Diego Company" },
      { name: "description", content: "Personalize sua camiseta: escolha a cor base e a estampa do seu jeito." },
      { property: "og:title", content: "Escolha sua estampa! San Diego Company" },
      { property: "og:description", content: "Personalize sua camiseta: escolha a cor base e a estampa do seu jeito." },
    ],
  }),
  component: Index,
});

type Color = { name: string; hex: string; img: string };
type Print = { id: string; name: string; image_url: string; scale?: number | null };

const COLORS: Color[] = [
  { name: "White", hex: "#ffffff", img: "https://gxquualboudegzptrfqs.supabase.co/storage/v1/object/public/prints/shirts/white.jpg" },
  { name: "Black", hex: "#1a1a1a", img: "https://gxquualboudegzptrfqs.supabase.co/storage/v1/object/public/prints/shirts/black.jpg" },
  { name: "Brown", hex: "#7f5539", img: "https://gxquualboudegzptrfqs.supabase.co/storage/v1/object/public/prints/shirts/brown.jpg" },
  { name: "Off-White", hex: "#f5f5f0", img: "https://gxquualboudegzptrfqs.supabase.co/storage/v1/object/public/prints/shirts/offwhite.jpg" },
];

const SIZES = ["P", "M", "G", "GG"] as const;

type CartItem = {
  id: string;
  colorName: string;
  printId: string;
  printName: string;
  size: string;
  quantity: number;
};

const ColorSwatch = memo(function ColorSwatch({
  color,
  active,
  onSelect,
}: {
  color: Color;
  active: boolean;
  onSelect: (name: string) => void;
}) {
  return (
    <button
      aria-label={`Select ${color.name}`}
      onClick={() => onSelect(color.name)}
      className={`flex-shrink-0 w-16 h-16 rounded-full border-2 shadow-sm snap-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition ${
        active ? "border-primary p-[3px]" : "border-transparent hover:border-surface-variant"
      }`}
      style={{ backgroundColor: active ? "transparent" : color.hex }}
    >
      {active && <span className="block w-full h-full rounded-full" style={{ backgroundColor: color.hex }} />}
    </button>
  );
});

const PrintThumb = memo(function PrintThumb({
  print,
  active,
  onSelect,
  innerRef,
}: {
  print: Print;
  active: boolean;
  onSelect: (id: string) => void;
  innerRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={innerRef}
      aria-label={`Select ${print.name}`}
      onClick={() => onSelect(print.id)}
      className={`h-20 rounded-lg border-2 bg-surface-container-low p-2 transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        active ? "border-primary" : "border-transparent hover:border-surface-variant"
      }`}
    >
      <img
        src={print.image_url}
        alt={print.name}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-contain"
      />
    </button>
  );
});

function Index() {
  const list = useServerFn(listPrints);
  const { data } = useQuery({
    queryKey: ["prints"],
    queryFn: () => list(),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const PRINTS: Print[] = data?.prints ?? [];

  const [colorIdx, setColorIdx] = useState(0);
  const [printIdx, setPrintIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const printsGridRef = useRef<HTMLDivElement>(null);
  const printItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const color = COLORS[colorIdx];
  const print = PRINTS[printIdx];

  const totalCartItems = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const addToCart = useCallback(() => {
    if (!selectedSize || !print) return;
    const key = `${color.name}__${print.id}__${selectedSize}`;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === key);
      if (existing) {
        return prev.map((i) => (i.id === key ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          id: key,
          colorName: color.name,
          printId: print.id,
          printName: print.name,
          size: selectedSize,
          quantity: 1,
        },
      ];
    });
    setCartOpen(true);
  }, [color.name, print, selectedSize]);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Intencionalmente sem auto-scroll: ao selecionar uma estampa, a posição
  // de rolagem da lista e da página deve permanecer estática.

  const changeColor = useCallback((i: number) => {
    setFading(true);
    setTimeout(() => {
      setColorIdx((i + COLORS.length) % COLORS.length);
      setFading(false);
    }, 150);
  }, []);

  const selectColorByName = useCallback((name: string) => {
    const i = COLORS.findIndex((c) => c.name === name);
    if (i >= 0) changeColor(i);
  }, [changeColor]);

  const printsLen = PRINTS.length;
  const nextPrint = useCallback(() => {
    if (printsLen > 0) setPrintIdx((p) => (p + 1) % printsLen);
  }, [printsLen]);
  const prevPrint = useCallback(() => {
    if (printsLen > 0) setPrintIdx((p) => (p - 1 + printsLen) % printsLen);
  }, [printsLen]);

  const printIdById = useMemo(() => {
    const m = new Map<string, number>();
    PRINTS.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [PRINTS]);

  const selectPrintById = useCallback((id: string) => {
    const i = printIdById.get(id);
    if (i !== undefined) setPrintIdx(i);
  }, [printIdById]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && printsLen > 0) {
      if (dx < 0) nextPrint();
      else prevPrint();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [nextPrint, prevPrint, printsLen]);

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      {/* Top app bar */}
      <header className="sticky top-0 z-40 w-full bg-background">
        <div className="flex justify-between items-center w-full max-w-[1280px] mx-auto h-20 px-6">
          <button aria-label="Close" className="hidden md:flex w-10 h-10 items-center justify-center text-secondary hover:text-primary transition active:scale-95">
            <X className="w-6 h-6" />
          </button>
          <h1 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-on-surface">
            Escolha sua estampa! San Diego Company
          </h1>
          <button
            onClick={() => setCartOpen((o) => !o)}
            aria-label="Shopping Bag"
            className="relative w-10 h-10 flex items-center justify-center text-primary hover:opacity-80 transition active:scale-95"
          >
            <ShoppingBag className="w-6 h-6" />
            {totalCartItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
                {totalCartItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex flex-col md:flex-row max-w-[1280px] mx-auto w-full px-4 md:px-6 gap-6 md:gap-12 py-6">
        {/* Preview */}
        <section
          className="w-full md:w-3/5 relative aspect-[4/5] bg-surface-container-lowest rounded-xl overflow-hidden product-preview-shadow flex items-center justify-center touch-pan-y select-none"
          style={{ contain: "layout paint", willChange: "contents" }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <img
            alt={`${color.name} t-shirt`}
            src={color.img}
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover absolute inset-0 z-0 transition-opacity duration-300"
            style={{ opacity: fading ? 0 : 1 }}
          />
          <div className="absolute inset-0 z-10 flex items-center justify-center flex-col pb-14 pl-1 pointer-events-none">
            {print && (
              <img
                src={print.image_url}
                alt={print.name}
                decoding="async"
                className="w-1/3 opacity-90 object-contain transition-transform duration-300"
                style={{ transform: `scale(${(print.scale ?? 100) / 100})`, transformOrigin: "center" }}
              />
            )}
          </div>
          {printsLen > 1 && (
            <>
              <button
                onClick={prevPrint}
                aria-label="Estampa anterior"
                className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm flex items-center justify-center transition active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextPrint}
                aria-label="Próxima estampa"
                className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm flex items-center justify-center transition active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </section>

        {/* Controls */}
        <section className="w-full md:w-2/5 flex flex-col gap-12 bg-surface-container-lowest p-6 rounded-xl border border-surface-variant">
          {/* Base color */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-medium">Cor Base</h2>
              <div className="flex gap-2">
                <button onClick={() => changeColor(colorIdx - 1)} aria-label="Previous color" className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => changeColor(colorIdx + 1)} aria-label="Next color" className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-secondary mb-3">{color.name}</p>
            <div className="carousel-container flex gap-4 overflow-x-auto pb-2 snap-x">
              {COLORS.map((c, i) => (
                <ColorSwatch key={c.name} color={c} active={i === colorIdx} onSelect={selectColorByName} />
              ))}
            </div>
          </div>

          <hr className="border-t border-surface-variant" />

          {/* Artwork */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-medium">Estampa</h2>
              <div className="flex gap-2">
                <button onClick={prevPrint} aria-label="Previous print" className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={nextPrint} aria-label="Next print" className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-secondary mb-3">{print?.name ?? "—"}</p>
            <div
              ref={printsGridRef}
              className="grid grid-cols-4 gap-3 overflow-y-auto overflow-x-hidden pb-4 pr-1 [mask-image:linear-gradient(to_bottom,black_calc(100%-48px),transparent)]"
              style={{ maxHeight: "calc(3 * 5rem + 2 * 0.75rem + 1rem)", contain: "layout paint" }}
            >
              {PRINTS.map((p, i) => (
                <PrintThumb
                  key={p.id}
                  print={p}
                  active={i === printIdx}
                  onSelect={selectPrintById}
                  innerRef={(el) => {
                    printItemRefs.current[i] = el;
                  }}
                />
              ))}
            </div>
          </div>

          <hr className="border-t border-surface-variant" />

          {/* Size selector */}
          <div>
            <h2 className="font-display text-xl font-medium mb-4">Tamanho</h2>
            <div className="flex gap-3">
              {SIZES.map((size) => {
                const active = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    aria-label={`Selecionar tamanho ${size}`}
                    className={`w-14 h-14 rounded-xl border-2 text-base font-bold transition flex items-center justify-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      active
                        ? "border-primary bg-primary text-on-primary shadow-sm"
                        : "border-surface-variant bg-surface-container text-on-surface hover:border-primary/50 hover:bg-surface-container-high"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto pt-2">
            <button
              onClick={addToCart}
              disabled={!selectedSize || !print}
              className="w-full py-3 px-6 rounded-full bg-green-600 text-white text-sm font-semibold tracking-wider uppercase hover:bg-green-700 transition flex items-center justify-center gap-2 active:scale-95 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              Adicionar ao Carrinho
            </button>
          </div>
        </section>
      </main>


      {/* Cart Sidebar */}
      <div
        onClick={() => setCartOpen(false)}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity ${
          cartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-surface-container-lowest shadow-xl flex flex-col transition-transform duration-300 ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 h-20 border-b border-surface-variant">
          <h2 className="font-display text-xl font-medium">Carrinho ({totalCartItems})</h2>
          <button
            onClick={() => setCartOpen(false)}
            aria-label="Fechar carrinho"
            className="w-10 h-10 flex items-center justify-center text-secondary hover:text-primary transition active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <p className="text-secondary text-sm text-center mt-8">Seu carrinho está vazio.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {cart.map((item, idx) => (
                <li
                  key={item.id}
                  className="p-3 rounded-lg border border-surface-variant bg-surface-container-low flex flex-col gap-2"
                >
                  <p className="text-sm text-on-surface">
                    {idx + 1}. {item.quantity}x Camiseta {item.colorName} - Tam {item.size} - Estampa: {item.printName}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        aria-label="Diminuir quantidade"
                        className="w-7 h-7 rounded-md bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        aria-label="Aumentar quantidade"
                        className="w-7 h-7 rounded-md bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      aria-label="Remover item"
                      className="w-8 h-8 rounded-md text-red-600 hover:bg-red-50 flex items-center justify-center transition active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-surface-variant px-6 py-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="p-3 rounded-lg bg-surface-container-low border border-surface-variant text-sm text-on-surface">
                Total de camisetas: {totalCartItems} camisetas
              </div>
            </div>
            <button
              onClick={() => {
                const items = cart
                  .map(
                    (item, idx) =>
                      `${idx + 1}. ${item.quantity}x Camiseta ${item.colorName} - Tam ${item.size} - Estampa: ${item.printName}`,
                  )
                  .join("\n");
                const message = `Olá! 👋 Acabei de montar um pedido de camisetas no app. Seguem os detalhes:\n\nRESUMO DO PEDIDO:\n${items}\n\nGostaria de confirmar o pedido. Como podemos fechar a forma de pagamento e os detalhes da entrega? Fico no aguardo!`;
                window.open(
                  `https://wa.me/5547997408889/?text=${encodeURIComponent(message)}`,
                  "_blank",
                );
              }}
              className="w-full py-3 px-6 rounded-full bg-green-600 text-white text-sm font-semibold tracking-wider uppercase hover:bg-green-700 transition active:scale-95 shadow-sm hover:shadow-md"
            >
              Confirmar pedido via WhatsApp!
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
