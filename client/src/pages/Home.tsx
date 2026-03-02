import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { Coins, Star, Shield, Zap, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663175234562/DZEcZwzBkEPiBJamnC6QJf";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: jackpot } = trpc.slots.jackpot.useQuery();
  const { data: packages } = trpc.shop.packages.useQuery();

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={`${CDN}/banner_main_web_94c02fbb.png`} alt="Banner" className="w-full h-full object-cover object-top opacity-60" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, oklch(0.10 0.025 280 / 0.3), oklch(0.10 0.025 280 / 0.95))" }} />
        </div>
        <div className="relative container py-20 md:py-32 text-center">
          <p className="text-xs md:text-sm font-display tracking-[0.3em] text-primary/80 mb-3 uppercase">El Casino del Otro Mundo</p>
          <h1 className="font-decorative text-4xl md:text-7xl font-black text-gold-gradient mb-4 leading-tight">
            Mushoku Tensei<br />Slots
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-sm md:text-base">
            Compra créditos digitales, gira los rodillos mágicos y acumula puntos para canjear por productos exclusivos del anime.
          </p>

          {/* Jackpot */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-primary/40 bg-card/60 backdrop-blur mb-8">
            <Coins className="text-primary" size={20} />
            <span className="text-xs font-display tracking-widest text-muted-foreground uppercase">Jackpot Progresivo</span>
            <span className="jackpot-text font-display font-black text-xl text-primary">
              {jackpot?.currentAmount?.toLocaleString() ?? "125,000"}
            </span>
            <span className="text-xs text-muted-foreground">monedas</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <Link href="/play">
                <Button size="lg" className="btn-spin text-base px-8 py-6 rounded-xl font-display tracking-wider">
                  <Zap size={20} className="mr-2" /> ¡GIRAR AHORA!
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="btn-spin text-base px-8 py-6 rounded-xl font-display tracking-wider" onClick={() => window.location.href = getLoginUrl()}>
                <Zap size={20} className="mr-2" /> COMENZAR A JUGAR
              </Button>
            )}
            <Link href="/shop">
              <Button variant="outline" size="lg" className="text-base px-8 py-6 rounded-xl font-display tracking-wider border-primary/40 hover:bg-primary/10">
                <Coins size={20} className="mr-2" /> Comprar Créditos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Personajes */}
      <section className="container py-16">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-center text-gold-gradient mb-10">Las Heroínas del Otro Mundo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { img: `${CDN}/roxy_card_web_186320a5.png`, name: "Roxy Migurdia", role: "Símbolo Wild", desc: "La Gran Maga del Agua. Símbolo Wild que multiplica x3 todas las combinaciones ganadoras.", color: "oklch(0.55 0.22 250)" },
            { img: `${CDN}/eris_card_web_5d8fe73d.png`, name: "Eris Boreas", role: "Símbolo Scatter", desc: "La Guerrera del Norte. 3 o más activan 10 Giros Gratis con multiplicador x2.", color: "oklch(0.55 0.22 25)" },
            { img: `${CDN}/sylphy_card_web_4868ed98.png`, name: "Sylphiette", role: "Símbolo Jackpot", desc: "La Maga del Viento. 5 en línea central activan el Jackpot Progresivo.", color: "oklch(0.55 0.22 145)" },
          ].map((char) => (
            <div key={char.name} className="card-fantasy rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="relative aspect-[3/4] overflow-hidden">
                <img src={char.img} alt={char.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, oklch(0.12 0.025 280), transparent 60%)` }} />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-xs font-display tracking-widest mb-1" style={{ color: char.color }}>{char.role}</p>
                  <h3 className="font-display font-bold text-lg text-foreground">{char.name}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground">{char.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Paquetes de créditos */}
      <section className="container py-16">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-center text-gold-gradient mb-3">Paquetes de Créditos</h2>
        <p className="text-center text-muted-foreground text-sm mb-10">Compra créditos digitales y conviértelos en jugadas. 1 jugada = 100 monedas.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {(packages ?? [
            { id: 1, name: "Paquete Aprendiz", coins: 500, bonusCoins: 0, priceUsd: "20.00", isPopular: false },
            { id: 2, name: "Paquete Mago", coins: 1500, bonusCoins: 150, priceUsd: "50.00", isPopular: true },
            { id: 3, name: "Paquete Rango S", coins: 4000, bonusCoins: 600, priceUsd: "100.00", isPopular: false },
          ]).map((pkg) => (
            <div key={pkg.id} className={`card-fantasy rounded-2xl p-6 relative ${pkg.isPopular ? "border-primary/60 glow-gold" : ""}`}>
              {pkg.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold font-display tracking-wider" style={{ background: "oklch(0.75 0.18 55)", color: "oklch(0.10 0.025 280)" }}>
                  MÁS POPULAR
                </div>
              )}
              <div className="text-center mb-4">
                <p className="font-display font-bold text-lg text-foreground mb-1">{pkg.name}</p>
                <div className="flex items-center justify-center gap-2">
                  <Coins className="text-primary" size={24} />
                  <span className="text-3xl font-black text-primary">{(pkg.coins + pkg.bonusCoins).toLocaleString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pkg.coins.toLocaleString()} + {pkg.bonusCoins > 0 ? <span className="text-accent">{pkg.bonusCoins} bonus</span> : "sin bonus"} monedas
                </p>
              </div>
              <div className="text-center mb-4">
                <span className="text-2xl font-black text-foreground">${pkg.priceUsd} USD</span>
                <p className="text-xs text-muted-foreground mt-1">{Math.floor((pkg.coins + pkg.bonusCoins) / 100)} jugadas disponibles</p>
              </div>
              <Link href="/shop">
                <Button className={`w-full ${pkg.isPopular ? "btn-spin" : "border border-primary/40 hover:bg-primary/10"}`} variant={pkg.isPopular ? "default" : "outline"}>
                  Comprar ahora
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="container py-16">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-center text-gold-gradient mb-10">Cómo Funciona</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { icon: <Coins size={28} className="text-primary" />, step: "01", title: "Compra Créditos", desc: "Adquiere monedas digitales con PayPal. Seguro y automático." },
            { icon: <Zap size={28} className="text-accent" />, step: "02", title: "Gira los Rodillos", desc: "Usa tus monedas para jugar. 1 jugada = 100 monedas." },
            { icon: <Star size={28} className="text-yellow-400" />, step: "03", title: "Acumula Puntos", desc: "Cada jugada te da puntos. Gana más con combinaciones especiales." },
            { icon: <Gift size={28} className="text-green-400" />, step: "04", title: "Canjea Productos", desc: "Usa tus puntos para obtener camisetas y merch exclusivo." },
          ].map((item) => (
            <div key={item.step} className="card-fantasy rounded-2xl p-6 text-center">
              <div className="flex justify-center mb-3">{item.icon}</div>
              <p className="text-xs font-display tracking-widest text-muted-foreground mb-2">PASO {item.step}</p>
              <h3 className="font-display font-bold text-base text-foreground mb-2">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="container py-8">
        <div className="max-w-3xl mx-auto p-4 rounded-xl border border-border bg-secondary/30 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield size={16} className="text-muted-foreground" />
            <p className="text-xs font-display tracking-wider text-muted-foreground uppercase">Juego Responsable</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Este es un sitio de entretenimiento con <strong>monedas virtuales</strong>. Las monedas no tienen valor monetario real, no son reembolsables y no son convertibles en dinero. Los puntos expiran a los 90 días. Solo canjeables por productos físicos. RTP teórico: 62%.
          </p>
        </div>
      </section>
    </div>
  );
}
