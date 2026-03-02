import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Coins, Star, Shield, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663175234562/DZEcZwzBkEPiBJamnC6QJf";

declare global {
  interface Window {
    paypal?: {
      Buttons: (opts: Record<string, unknown>) => { render: (id: string) => void };
    };
  }
}

function PayPalButton({ packageId, priceUsd, onSuccess }: { packageId: number; priceUsd: string; onSuccess: (coins: number) => void }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const containerId = `paypal-btn-${packageId}`;

  const createOrder = trpc.shop.createPaypalOrder.useMutation();
  const captureOrder = trpc.shop.capturePaypalOrder.useMutation();

  useEffect(() => {
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setError("PayPal no configurado. Agrega VITE_PAYPAL_CLIENT_ID.");
      return;
    }

    const scriptId = "paypal-sdk";
    if (document.getElementById(scriptId)) {
      if (window.paypal) initButtons();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.onload = () => { setLoaded(true); initButtons(); };
    script.onerror = () => setError("Error al cargar PayPal SDK.");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (loaded) initButtons();
  }, [loaded]);

  function initButtons() {
    if (!window.paypal) return;
    try {
      window.paypal.Buttons({
        createOrder: async () => {
          const res = await createOrder.mutateAsync({ packageId });
          return res.orderId;
        },
        onApprove: async (data: { orderID: string }) => {
          const res = await captureOrder.mutateAsync({ orderId: data.orderID });
          if (res.success) onSuccess(res.coinsAdded);
        },
        onError: (err: unknown) => {
          console.error(err);
          toast.error("Error en el pago. Intenta de nuevo.");
        },
        style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
      }).render(`#${containerId}`);
    } catch (e) {
      console.error(e);
    }
  }

  if (error) return <p className="text-xs text-destructive text-center py-2">{error}</p>;
  return <div id={containerId} className="mt-3" />;
}

export default function Shop() {
  const { isAuthenticated } = useAuth();
  const { data: packages } = trpc.shop.packages.useQuery();
  const { data: balance, refetch } = trpc.wallet.balance.useQuery(undefined, { enabled: isAuthenticated });
  const [purchasedPkg, setPurchasedPkg] = useState<number | null>(null);

  function handleSuccess(coins: number, pkgId: number) {
    toast.success(`¡${coins.toLocaleString()} monedas acreditadas automáticamente!`, { duration: 5000 });
    setPurchasedPkg(pkgId);
    refetch();
    setTimeout(() => setPurchasedPkg(null), 5000);
  }

  return (
    <div className="container py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-black text-gold-gradient mb-3">Tienda de Créditos</h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Compra créditos digitales de forma segura con PayPal. Se acreditan automáticamente en tu cuenta al instante.
          </p>
          {isAuthenticated && balance && (
            <div className="inline-flex items-center gap-4 mt-4 px-6 py-3 rounded-full card-fantasy border border-border">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-primary" />
                <span className="font-bold text-primary">{balance.coins.toLocaleString()} monedas</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <Star size={16} className="text-accent" />
                <span className="font-bold text-accent">{balance.points.toLocaleString()} puntos</span>
              </div>
            </div>
          )}
        </div>

        {/* Flujo visual */}
        <div className="flex items-center justify-center gap-2 mb-10 text-xs text-muted-foreground flex-wrap">
          {["Elige paquete","Paga con PayPal","Monedas acreditadas","¡A jugar!"].map((step, i) => (
            <>
              <span key={step} className="px-3 py-1.5 rounded-full bg-secondary border border-border font-display tracking-wider">{step}</span>
              {i < 3 && <span key={`arrow-${i}`} className="text-primary">→</span>}
            </>
          ))}
        </div>

        {/* Packages */}
        {!isAuthenticated ? (
          <div className="text-center py-16">
            <img src={`${CDN}/symbol_coin_web_d19e1f4c.png`} alt="Coins" className="w-24 mx-auto mb-4 opacity-60" />
            <h2 className="font-display text-xl font-bold text-gold-gradient mb-3">Inicia Sesión para Comprar</h2>
            <Button className="btn-spin px-8" onClick={() => window.location.href = getLoginUrl()}>
              <Zap size={16} className="mr-2" /> Iniciar Sesión
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(packages ?? []).map((pkg) => {
              const total = pkg.coins + pkg.bonusCoins;
              const isPurchased = purchasedPkg === pkg.id;
              return (
                <div key={pkg.id} className={`card-fantasy rounded-2xl p-6 relative flex flex-col ${pkg.isPopular ? "border-primary/60 glow-gold" : ""}`}>
                  {pkg.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold font-display tracking-wider bg-primary text-primary-foreground">
                      MÁS POPULAR
                    </div>
                  )}
                  {isPurchased && (
                    <div className="absolute inset-0 rounded-2xl bg-green-500/10 border-2 border-green-500/50 flex items-center justify-center z-10">
                      <div className="text-center">
                        <CheckCircle className="text-green-400 mx-auto mb-2" size={40} />
                        <p className="font-display font-bold text-green-400">¡Compra Exitosa!</p>
                        <p className="text-xs text-green-300">+{total.toLocaleString()} monedas</p>
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <img src={`${CDN}/symbol_coin_web_d19e1f4c.png`} alt="coins" className="w-16 mx-auto mb-2" />
                    <h3 className="font-display font-bold text-lg text-foreground">{pkg.name}</h3>
                  </div>

                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Coins className="text-primary" size={24} />
                      <span className="text-4xl font-black text-primary">{total.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pkg.coins.toLocaleString()} monedas
                      {pkg.bonusCoins > 0 && <span className="text-accent"> + {pkg.bonusCoins.toLocaleString()} bonus</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{Math.floor(total / 100)} jugadas disponibles</p>
                  </div>

                  <div className="text-center mb-2">
                    <span className="text-3xl font-black text-foreground">${pkg.priceUsd}</span>
                    <span className="text-sm text-muted-foreground ml-1">USD</span>
                  </div>

                  <div className="mt-auto">
                    <PayPalButton
                      packageId={pkg.id}
                      priceUsd={pkg.priceUsd}
                      onSuccess={(coins) => handleSuccess(coins, pkg.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Garantías */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {[
            { icon: <Shield size={20} className="text-green-400" />, title: "Pago Seguro", desc: "Procesado por PayPal. Tus datos financieros nunca tocan nuestros servidores." },
            { icon: <Zap size={20} className="text-primary" />, title: "Acreditación Inmediata", desc: "Las monedas se acreditan automáticamente en segundos tras confirmar el pago." },
            { icon: <CheckCircle size={20} className="text-accent" />, title: "Sin Reembolsos", desc: "Las monedas virtuales no son reembolsables ni convertibles en dinero real." },
          ].map((g) => (
            <div key={g.title} className="card-fantasy rounded-xl p-4 flex gap-3">
              <div className="shrink-0 mt-0.5">{g.icon}</div>
              <div>
                <p className="font-display font-bold text-sm text-foreground mb-1">{g.title}</p>
                <p className="text-xs text-muted-foreground">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
