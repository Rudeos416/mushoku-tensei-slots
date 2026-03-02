import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Coins, Star, ShoppingCart, History, Gift, Gamepad2, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663175234562/DZEcZwzBkEPiBJamnC6QJf";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const { data: balance } = trpc.wallet.balance.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 5000 });

  const navLinks = [
    { href: "/", label: "Inicio", icon: <Gamepad2 size={16} /> },
    { href: "/play", label: "Jugar", icon: <Coins size={16} /> },
    { href: "/shop", label: "Créditos", icon: <ShoppingCart size={16} /> },
    { href: "/history", label: "Historial", icon: <History size={16} /> },
    { href: "/redeem", label: "Canjear", icon: <Gift size={16} /> },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border" style={{ background: "oklch(0.10 0.025 280 / 0.95)", backdropFilter: "blur(12px)" }}>
      <div className="container flex items-center justify-between h-16 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src={`${CDN}/symbol_magic_web_11430a2b.png`} alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-display font-bold text-sm md:text-base text-gold-gradient hidden sm:block">MT Slots</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <button className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                location === link.href
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}>
                {link.icon}
                <span className="hidden md:block">{link.label}</span>
              </button>
            </Link>
          ))}
        </div>

        {/* Balance + Auth */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated && balance && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary border border-border">
                <Coins size={14} className="text-primary" />
                <span className="font-bold text-primary">{balance.coins.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary border border-border">
                <Star size={14} className="text-accent" />
                <span className="font-bold text-accent">{balance.points.toLocaleString()}</span>
              </div>
            </div>
          )}

          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={() => logout()} className="text-xs gap-1.5">
              <LogOut size={14} />
              <span className="hidden md:block">Salir</span>
            </Button>
          ) : (
            <Button size="sm" onClick={() => window.location.href = getLoginUrl()} className="btn-spin text-xs gap-1.5">
              <LogIn size={14} />
              <span>Entrar</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
