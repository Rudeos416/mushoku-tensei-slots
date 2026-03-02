import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Coins, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663175234562/DZEcZwzBkEPiBJamnC6QJf";

const SYMBOL_IMGS: Record<string, string> = {
  roxy:`${CDN}/roxy_card_web_186320a5.png`, eris:`${CDN}/eris_card_web_5d8fe73d.png`,
  sylphy:`${CDN}/sylphy_card_web_4868ed98.png`, magic:`${CDN}/symbol_magic_web_11430a2b.png`,
  sword:`${CDN}/symbol_sword_web_8e7c95d5.png`, gem:`${CDN}/symbol_gem_web_3c6f5a83.png`,
  scroll:`${CDN}/symbol_scroll_web_d35a59d6.png`, coin:`${CDN}/symbol_coin_web_d19e1f4c.png`,
  wild:`${CDN}/symbol_wild_web_a50c9880.png`, scatter:`${CDN}/symbol_scatter_web_5685ea63.png`,
};

export default function History() {
  const { isAuthenticated } = useAuth();
  const { data: history, isLoading } = trpc.slots.history.useQuery({ limit: 30 }, { enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6 text-center container">
        <h2 className="font-display text-2xl font-bold text-gold-gradient">Inicia Sesión</h2>
        <p className="text-muted-foreground">Necesitas una cuenta para ver tu historial.</p>
        <Button className="btn-spin px-8" onClick={() => window.location.href = getLoginUrl()}>
          <Zap size={16} className="mr-2" /> Iniciar Sesión
        </Button>
      </div>
    );
  }

  const totalBet = history?.reduce((a, s) => a + s.betCoins, 0) ?? 0;
  const totalWon = history?.reduce((a, s) => a + s.winCoins, 0) ?? 0;
  const totalPoints = history?.reduce((a, s) => a + s.pointsEarned, 0) ?? 0;

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-black text-gold-gradient text-center mb-8">Historial de Giros</h1>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card-fantasy rounded-xl p-4 text-center">
            <p className="text-xs font-display tracking-wider text-muted-foreground mb-1">APOSTADO</p>
            <div className="flex items-center justify-center gap-1">
              <TrendingDown size={16} className="text-destructive" />
              <span className="font-black text-destructive text-lg">{totalBet.toLocaleString()}</span>
            </div>
          </div>
          <div className="card-fantasy rounded-xl p-4 text-center">
            <p className="text-xs font-display tracking-wider text-muted-foreground mb-1">GANADO</p>
            <div className="flex items-center justify-center gap-1">
              <TrendingUp size={16} className="text-green-400" />
              <span className="font-black text-green-400 text-lg">{totalWon.toLocaleString()}</span>
            </div>
          </div>
          <div className="card-fantasy rounded-xl p-4 text-center">
            <p className="text-xs font-display tracking-wider text-muted-foreground mb-1">PUNTOS</p>
            <div className="flex items-center justify-center gap-1">
              <Coins size={16} className="text-accent" />
              <span className="font-black text-accent text-lg">{totalPoints.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* History list */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Cargando historial...</div>
        ) : !history?.length ? (
          <div className="text-center py-16">
            <img src={`${CDN}/symbol_scroll_web_d35a59d6.png`} alt="empty" className="w-20 mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground font-display">Sin giros todavía. ¡Ve a jugar!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((spin) => {
              const reels: string[][] = JSON.parse(spin.reels);
              const centerRow = reels.map((r) => r[1]);
              const won = spin.winCoins > 0;
              return (
                <div key={spin.id} className={`card-fantasy rounded-xl p-4 border ${won ? "border-primary/30" : "border-border"}`}>
                  <div className="flex items-center gap-3">
                    {/* Reels preview (center row) */}
                    <div className="flex gap-1 shrink-0">
                      {centerRow.map((sym, i) => (
                        <div key={i} className={`w-9 h-9 rounded-lg flex items-center justify-center ${won ? "bg-primary/10 border border-primary/30" : "bg-secondary border border-border"}`}>
                          <img src={SYMBOL_IMGS[sym] ?? SYMBOL_IMGS.coin} alt={sym} className="w-7 h-7 object-contain" />
                        </div>
                      ))}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {spin.isJackpot && <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold font-display">JACKPOT</span>}
                        {won && !spin.isJackpot && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">VICTORIA</span>}
                        {!won && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Sin ganancia</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(spin.createdAt).toLocaleString("es-ES")}
                      </p>
                    </div>

                    {/* Numbers */}
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Apuesta: <span className="text-foreground font-bold">{spin.betCoins.toLocaleString()}</span></p>
                      {won ? (
                        <p className="text-sm font-black text-green-400">+{spin.winCoins.toLocaleString()}</p>
                      ) : (
                        <p className="text-sm font-black text-destructive">-{spin.betCoins.toLocaleString()}</p>
                      )}
                      <p className="text-xs text-accent">+{spin.pointsEarned} pts</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
