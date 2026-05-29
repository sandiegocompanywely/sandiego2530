import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPrints } from "@/lib/prints.functions";
import { X, ShoppingBag, ChevronLeft, ChevronRight, Heart, Share2, Home, Star, Send, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Monte seu Look — Camiseta Personalizada" },
      { name: "description", content: "Personalize sua camiseta: escolha a cor base e a estampa do seu jeito." },
      { property: "og:title", content: "Monte seu Look" },
      { property: "og:description", content: "Personalize sua camiseta: escolha a cor base e a estampa do seu jeito." },
    ],
  }),
  component: Index,
});

type Color = { name: string; hex: string; img: string };
type Print = { id: string; name: string; image_url: string };

const COLORS: Color[] = [
  { name: "White", hex: "#ffffff", img: "https://lh3.googleusercontent.com/aida/ADBb0uiDRz5eQ3CZ92NphgaGh1E072RDBJSCCRkr92JZHXdy0Scoihm4GnphsmCpvK2rdhxkbJ0lOB0VwE1vz7K_ydC8iKMDG9GXBii2fvcmwFu5W_1A3zSmEWvlhfCIvrhP15OdiLh-7cAcFG3c-RT1vuoQ7FUEcirkQ-rAINg4C_X-DQdV_0yCFeD3qyMsOfTIEcSnWY_z9ZqrHGUREn6OWcN0B93DTmgYjOCXFUDkBQRyxXN2I5nOv0L56RM" },
  { name: "Black", hex: "#1a1a1a", img: "https://lh3.googleusercontent.com/aida/ADBb0uizC1f_QbPXfb84GpcdKNJf9McILPjCAvgGxZ464-16FTo35BHRpNSfM0Hu73cLC7BE0siqRPhgqXwwK6YYo3qmf0wLzVnwWsGZEAJhKojWe5w-bmQ3amvxtT0s3-GkJgkLN737pVnf3KjyvbJPNFs5JVgzbKHRJC9QUFOjJw7dAvUilguS3WvNKZB3oz9wMtAaXaltRWqG8oeNubdBjQ9OYTChp1XLnioBIt3KBW0EhO2-imqnxx6aaTw" },
  { name: "Brown", hex: "#7f5539", img: "https://lh3.googleusercontent.com/aida/ADBb0uiL71k0Gi9tSnLCiVQX-tUX8o4rfdsU950o9YT8q7B_hNNmEWHlT5d-OWFoZ5yBy8WMAU1DhBKWPAPm5DJbA2hw8lBeV0c4Rq5_1P0iycI9hfdZ9xM_uWzzXU19K5AzCTq1go7XbMXc8ieaszk9QWnEwz7OMftqsh7wKa1kHGvE_J7tyhgJ--ajwR30emgi4v2JMUK7tT6QetP8wU-JHYz3Ui1AVLw6ULq72Jrse4bF5QODEGiPoMymoMw" },
  { name: "Off-White", hex: "#f5f5f0", img: "https://lh3.googleusercontent.com/aida/ADBb0uhZjBxIXf0lTxUPsXZAjvbbvdapeGvo3U-9dcxBarXHA0h5AoyX25fP3kynuKsXzc5ghomuRiVwai98E2urqd3g7yVizS-2ICVduN0Xa9w2SxcCblpLJpbGJ-Gy6L-44qXrHXs6UFASg8KIwu6p1QXBSEvsgxwiXZLjWSGILob1C0zDH70nG_TInIdiuhPF3IORu7ByFSVfp7qUx3DfBw-NnVnP-JOksv5KHiFx7M2PBjUbx8M6c5PgcA" },
];

function Index() {
  const list = useServerFn(listPrints);
  const { data } = useQuery({
    queryKey: ["prints"],
    queryFn: () => list(),
  });
  const PRINTS: Print[] = data?.prints ?? [];

  const [colorIdx, setColorIdx] = useState(0);
  const [printIdx, setPrintIdx] = useState(0);
  const [fading, setFading] = useState(false);

  const color = COLORS[colorIdx];
  const print = PRINTS[printIdx];

  const changeColor = (i: number) => {
    setFading(true);
    setTimeout(() => {
      setColorIdx((i + COLORS.length) % COLORS.length);
      setFading(false);
    }, 150);
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      {/* Top app bar */}
      <header className="sticky top-0 z-40 w-full bg-background">
        <div className="flex justify-between items-center w-full max-w-[1280px] mx-auto h-20 px-6">
          <button aria-label="Close" className="w-10 h-10 flex items-center justify-center text-secondary hover:text-primary transition active:scale-95">
            <X className="w-6 h-6" />
          </button>
          <h1 className="font-display text-2xl md:text-3xl font-medium tracking-tight text-on-surface">
            Monte seu Look
          </h1>
          <button aria-label="Shopping Bag" className="w-10 h-10 flex items-center justify-center text-primary hover:opacity-80 transition active:scale-95">
            <ShoppingBag className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex flex-col md:flex-row max-w-[1280px] mx-auto w-full px-4 md:px-6 gap-6 md:gap-12 py-6">
        {/* Preview */}
        <section className="w-full md:w-3/5 relative aspect-[4/5] bg-surface-container-lowest rounded-xl overflow-hidden product-preview-shadow flex items-center justify-center">
          <img
            alt={`${color.name} t-shirt`}
            src={color.img}
            className="w-full h-full object-cover absolute inset-0 z-0 transition-opacity duration-300"
            style={{ opacity: fading ? 0 : 1 }}
          />
          <div className="absolute inset-0 z-10 flex items-center justify-center flex-col pb-20 pointer-events-none">
            {print && (
              <img src={print.image_url} alt={print.name} className="w-1/3 max-w-[150px] opacity-90 object-contain transition-all duration-300" />
            )}
          </div>
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
              {COLORS.map((c, i) => {
                const active = i === colorIdx;
                return (
                  <button
                    key={c.name}
                    aria-label={`Select ${c.name}`}
                    onClick={() => changeColor(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-full border-2 shadow-sm snap-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition ${
                      active ? "border-primary p-[3px]" : "border-transparent hover:border-surface-variant"
                    }`}
                    style={{
                      backgroundColor: active ? "transparent" : c.hex,
                    }}
                  >
                    {active && (
                      <span className="block w-full h-full rounded-full" style={{ backgroundColor: c.hex }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-t border-surface-variant" />

          {/* Artwork */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-medium">Estampa</h2>
              <div className="flex gap-2">
                <button onClick={() => setPrintIdx((printIdx - 1 + PRINTS.length) % PRINTS.length)} aria-label="Previous print" className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPrintIdx((printIdx + 1) % PRINTS.length)} aria-label="Next print" className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-secondary mb-3">{print?.name ?? "—"}</p>
            <div className="carousel-container flex gap-4 overflow-x-auto pb-2 snap-x">
              {PRINTS.map((p, i) => {
                const active = i === printIdx;
                return (
                  <button
                    key={p.id}
                    aria-label={`Select ${p.name}`}
                    onClick={() => setPrintIdx(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 bg-surface-container-low p-2 snap-center transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                      active ? "border-primary" : "border-transparent hover:border-surface-variant"
                    }`}
                  >
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto pt-2 flex flex-col sm:flex-row gap-4">
            <button className="w-full sm:w-1/2 py-3 px-6 rounded-full border-2 border-secondary-container text-on-surface text-sm font-semibold tracking-wider uppercase hover:bg-surface-container-low transition flex items-center justify-center gap-2 active:scale-95">
              <Heart className="w-5 h-5" />
              Salvar Favorito
            </button>
            <button className="w-full sm:w-1/2 py-3 px-6 rounded-full bg-primary text-on-primary text-sm font-semibold tracking-wider uppercase hover:opacity-90 transition flex items-center justify-center gap-2 active:scale-95 shadow-sm hover:shadow-md">
              <Share2 className="w-5 h-5" />
              Exportar Imagem
            </button>
          </div>
        </section>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest border-t border-secondary-container rounded-t-xl">
        <ul className="flex justify-around items-center px-4 py-3">
          {[
            { icon: Home, label: "Início", active: false },
            { icon: Star, label: "Favoritos", active: false },
            { icon: Send, label: "Exportar", active: true },
            { icon: ShoppingCart, label: "Carrinho", active: false },
          ].map(({ icon: Icon, label, active }) => (
            <li key={label}>
              <a
                href="#"
                aria-label={label}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition active:scale-90 ${
                  active ? "text-primary font-bold" : "text-secondary hover:bg-surface-container-high"
                }`}
              >
                <Icon className="w-5 h-5 mb-1" fill={active ? "currentColor" : "none"} />
                <span className="text-xs font-medium">{label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
