import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Coins, Star, Zap, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663175234562/DZEcZwzBkEPiBJamnC6QJf";

const SYMBOL_IMGS: Record<string, string> = {
  roxy:    `${CDN}/roxy_card_web_186320a5.png`,
  eris:    `${CDN}/eris_card_web_5d8fe73d.png`,
  sylphy:  `${CDN}/sylphy_card_web_4868ed98.png`,
  magic:   `${CDN}/symbol_magic_web_11430a2b.png`,
  sword:   `${CDN}/symbol_sword_web_8e7c95d5.png`,
  gem:     `${CDN}/symbol_gem_web_3c6f5a83.png`,
  scroll:  `${CDN}/symbol_scroll_web_d35a59d6.png`,
  coin:    `${CDN}/symbol_coin_web_d19e1f4c.png`,
  wild:    `${CDN}/symbol_wild_web_a50c9880.png`,
  scatter: `${CDN}/symbol_scatter_web_5685ea63.png`,
};

const SYMBOL_LABELS: Record<string, string> = {
  roxy:"Roxy", eris:"Eris", sylphy:"Sylphy", magic:"Círculo", sword:"Espada",
  gem:"Gema", scroll:"Pergamino", coin:"Moneda", wild:"WILD", scatter:"SCATTER",
};

const BET_OPTIONS = [100, 200, 500, 1000, 2000, 5000];

// Confetti particle component
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute coin-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            animationDuration: `${1.5 + Math.random() * 2}s`,
            animationDelay: `${Math.random() * 0.5}s`,
            fontSize: `${16 + Math.random() * 16}px`,
          }}
        >
          {["🪙","⭐","💎","✨","🌟"][Math.floor(Math.random() * 5)]}
        </div>
      ))}
    </div>
  );
}

export default function Play() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [reels, setReels] = useState<string[][]>([
    ["coin","gem","scroll"],["magic","sword","coin"],["gem","scroll","magic"],
    ["sword","coin","gem"],["scroll","magic","sword"],
  ]);
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(100);
  const [winLines, setWinLines] = useState<number[]>([]);
  const [lastWin, setLastWin] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const autoRef = useRef(false);

  const { data: balance, refetch: refetchBalance } = trpc.wallet.balance.useQuery(undefined, { enabled: isAuthenticated });
  const { data: jackpot, refetch: refetchJackpot } = trpc.slots.jackpot.useQuery();

  const spinMutation = trpc.slots.spin.useMutation({
    onSuccess: (data) => {
      setReels(data.reels as string[][]);
      setWinLines(data.lines);
      setLastWin(data.winCoins);
      refetchBalance();
      refetchJackpot();

      if (data.isJackpot) {
        toast.success(`¡¡¡JACKPOT!!! Ganaste ${data.jackpotWon.toLocaleString()} monedas`, { duration: 8000 });
        setShowWin(true);
        setConfetti(true);
        setTimeout(() => setConfetti(false), 4000);
      } else if (data.winCoins > 0) {
        if (data.winCoins >= bet * 5) {
          setShowWin(true);
          setConfetti(true);
          setTimeout(() => setConfetti(false), 3000);
        } else {
          toast.success(`+${data.winCoins.toLocaleString()} monedas`, { duration: 2000 });
        }
      }
      setSpinning(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setSpinning(false);
      setAutoSpin(false);
      autoRef.current = false;
    },
  });

  const doSpin = useCallback(() => {
    if (spinning || !isAuthenticated) return;
    if (!balance || balance.coins < bet) {
      toast.error("Monedas insuficientes. Compra más créditos.");
      setAutoSpin(false);
      autoRef.current = false;
      return;
    }
    setSpinning(true);
    setWinLines([]);
    setLastWin(0);
    setShowWin(false);
    spinMutation.mutate({ betCoins: bet });
  }, [spinning, isAuthenticated, balance, bet, spinMutation]);

  useEffect(() => {
    autoRef.current = autoSpin;
  }, [autoSpin]);

  useEffect(() => {
    if (!spinning && autoRef.current) {
      const t = setTimeout(() => { if (autoRef.current) doSpin(); }, 800);
      return () => clearTimeout(t);
    }
  }, [spinning, doSpin]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6 text-center container">
        <img src={`${CDN}/roxy_card_web_186320a5.png`} alt="Roxy" className="w-48 rounded-2xl opacity-80" />
        <h2 className="font-display text-2xl font-bold text-gold-gradient">Inicia Sesión para Jugar</h2>
        <p className="text-muted-foreground">Necesitas una cuenta para usar tus monedas y girar los rodillos.</p>
        <Button className="btn-spin px-8 py-4 text-base font-display" onClick={() => window.location.href = getLoginUrl()}>
          <Zap size={18} className="mr-2" /> Iniciar Sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Confetti active={confetti} />

      {/* Win overlay */}
      {showWin && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowWin(false)}>
          <div className="card-fantasy rounded-3xl p-10 text-center max-w-sm mx-4 glow-gold">
            <p className="font-decorative text-5xl font-black text-gold-gradient mb-2">¡VICTORIA!</p>
            <p className="text-6xl font-black text-primary mb-4">{lastWin.toLocaleString()}</p>
            <p className="text-muted-foreground mb-6">monedas ganadas</p>
            <Button className="btn-spin px-8" onClick={() => setShowWin(false)}>Continuar</Button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card-fantasy rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground font-display tracking-wider mb-1">BALANCE</p>
            <div className="flex items-center justify-center gap-1">
              <Coins size={16} className="text-primary" />
              <span className="font-black text-primary text-lg">{balance?.coins?.toLocaleString() ?? 0}</span>
            </div>
          </div>
          <div className="card-fantasy rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground font-display tracking-wider mb-1">JACKPOT</p>
            <span className="jackpot-text font-black text-primary text-lg">{jackpot?.currentAmount?.toLocaleString() ?? "125,000"}</span>
          </div>
          <div className="card-fantasy rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground font-display tracking-wider mb-1">PUNTOS</p>
            <div className="flex items-center justify-center gap-1">
              <Star size={16} className="text-accent" />
              <span className="font-black text-accent text-lg">{balance?.points?.toLocaleString() ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Slot machine */}
        <div className="card-fantasy rounded-3xl p-4 md:p-6 mb-6">
          <p className="text-center font-display text-sm tracking-widest text-muted-foreground mb-4 uppercase">✦ Tragamonedas Mágicas ✦</p>

          {/* Reels grid: 5 columns × 3 rows */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {Array.from({ length: 5 }).map((_, col) =>
              Array.from({ length: 3 }).map((_, row) => {
                const sym = reels[col]?.[row] ?? "coin";
                const isWin = winLines.includes(row);
                return (
                  <div
                    key={`${col}-${row}`}
                    className={`reel-cell aspect-square ${spinning ? "reel-spinning" : ""} ${isWin ? "winning" : ""}`}
                  >
                    <img
                      src={SYMBOL_IMGS[sym] ?? SYMBOL_IMGS.coin}
                      alt={SYMBOL_LABELS[sym] ?? sym}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Last win display */}
          <div className="text-center mb-4 h-8">
            {lastWin > 0 && (
              <p className="font-display font-bold text-primary animate-bounce">
                +{lastWin.toLocaleString()} monedas ganadas
              </p>
            )}
          </div>

          {/* Bet selector */}
          <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
            <span className="text-xs font-display tracking-wider text-muted-foreground">APUESTA:</span>
            <button className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border" onClick={() => { const idx = BET_OPTIONS.indexOf(bet); if (idx > 0) setBet(BET_OPTIONS[idx - 1]); }}>
              <Minus size={14} />
            </button>
            <span className="font-black text-primary text-lg min-w-[80px] text-center">{bet.toLocaleString()}</span>
            <button className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border" onClick={() => { const idx = BET_OPTIONS.indexOf(bet); if (idx < BET_OPTIONS.length - 1) setBet(BET_OPTIONS[idx + 1]); }}>
              <Plus size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {BET_OPTIONS.map((b) => (
              <button key={b} onClick={() => setBet(b)} className={`px-3 py-1.5 rounded-lg text-xs font-bold font-display transition-all ${bet === b ? "bg-primary text-primary-foreground" : "bg-secondary border border-border hover:border-primary/40"}`}>
                {b.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              className="btn-spin px-10 py-6 text-lg font-display rounded-xl min-w-[160px]"
              disabled={spinning || !balance || balance.coins < bet}
              onClick={doSpin}
            >
              {spinning ? "GIRANDO..." : "⚡ GIRAR ⚡"}
            </Button>
            <Button
              variant="outline"
              className={`px-6 py-6 font-display text-sm rounded-xl border-primary/40 ${autoSpin ? "bg-primary/20 border-primary text-primary" : ""}`}
              onClick={() => { setAutoSpin(!autoSpin); autoRef.current = !autoSpin; }}
            >
              {autoSpin ? "DETENER AUTO" : "AUTO GIRO"}
            </Button>
            <Link href="/shop">
              <Button variant="outline" className="px-6 py-6 font-display text-sm rounded-xl border-accent/40 hover:bg-accent/10 text-accent">
                + CRÉDITOS
              </Button>
            </Link>
          </div>
        </div>

        {/* Payout table */}
        <div className="card-fantasy rounded-2xl p-4 md:p-6">
          <h3 className="font-display font-bold text-center text-gold-gradient mb-4 tracking-wider">TABLA DE PAGOS</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { sym: "wild", label: "WILD", pays: "x60 / x150" },
              { sym: "scatter", label: "SCATTER", pays: "x20 / x80" },
              { sym: "roxy", label: "Roxy", pays: "x40 / x100" },
              { sym: "eris", label: "Eris", pays: "x15 / x50" },
              { sym: "sylphy", label: "Sylphy", pays: "x25 / x200" },
              { sym: "magic", label: "Círculo", pays: "x18 / x60" },
              { sym: "sword", label: "Espada", pays: "x12 / x40" },
              { sym: "gem", label: "Gema", pays: "x8 / x25" },
              { sym: "scroll", label: "Pergamino", pays: "x5 / x15" },
              { sym: "coin", label: "Moneda", pays: "x4 / x10" },
            ].map((s) => (
              <div key={s.sym} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border">
                <img src={SYMBOL_IMGS[s.sym]} alt={s.label} className="w-10 h-10 object-contain" />
                <div>
                  <p className="text-xs font-bold text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.pays}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">3 iguales / 5 iguales · RTP teórico: 62%</p>
        </div>
      </div>
    </div>
  );
}
