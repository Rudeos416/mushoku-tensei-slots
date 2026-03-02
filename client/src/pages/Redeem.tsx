import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { toast } from "sonner";
import { Star, Gift, Package, Zap, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663175234562/DZEcZwzBkEPiBJamnC6QJf";

type Product = { id: number; name: string; description: string | null; pointsCost: number; stock: number; category: string; imageUrl: string | null };

export default function Redeem() {
  const { isAuthenticated } = useAuth();
  const { data: products } = trpc.products.list.useQuery();
  const { data: balance, refetch } = trpc.wallet.balance.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myRedemptions } = trpc.products.myRedemptions.useQuery(undefined, { enabled: isAuthenticated });

  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", address: "", city: "", country: "" });
  const [success, setSuccess] = useState(false);

  const redeemMutation = trpc.products.redeem.useMutation({
    onSuccess: (data) => {
      toast.success("¡Canje exitoso! Tu pedido está en proceso.");
      setSuccess(true);
      refetch();
      setTimeout(() => { setSelected(null); setSuccess(false); }, 3000);
    },
    onError: (err) => toast.error(err.message),
  });

  function handleRedeem() {
    if (!selected) return;
    if (!form.name || !form.address || !form.city || !form.country) {
      toast.error("Completa todos los campos de envío.");
      return;
    }
    redeemMutation.mutate({
      productId: selected.id,
      shippingName: form.name,
      shippingAddress: form.address,
      shippingCity: form.city,
      shippingCountry: form.country,
    });
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6 text-center container">
        <h2 className="font-display text-2xl font-bold text-gold-gradient">Inicia Sesión</h2>
        <p className="text-muted-foreground">Necesitas una cuenta para canjear productos.</p>
        <Button className="btn-spin px-8" onClick={() => window.location.href = getLoginUrl()}>
          <Zap size={16} className="mr-2" /> Iniciar Sesión
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-black text-gold-gradient mb-3">Canjear Puntos</h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Usa tus puntos para obtener productos físicos exclusivos de Mushoku Tensei. Envío gratis a cualquier parte.
          </p>
          {balance && (
            <div className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-full card-fantasy border border-border">
              <Star size={16} className="text-accent" />
              <span className="font-bold text-accent text-lg">{balance.points.toLocaleString()} puntos disponibles</span>
            </div>
          )}
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {(products ?? []).map((prod) => {
            const canAfford = (balance?.points ?? 0) >= prod.pointsCost;
            return (
              <div key={prod.id} className={`card-fantasy rounded-2xl overflow-hidden flex flex-col ${!canAfford ? "opacity-60" : ""}`}>
                <div className="aspect-square bg-secondary/40 flex items-center justify-center p-6">
                  {prod.imageUrl ? (
                    <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-contain" />
                  ) : (
                    <Package size={64} className="text-muted-foreground/40" />
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-display font-bold text-sm text-foreground mb-1">{prod.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3 flex-1">{prod.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-accent" />
                      <span className="font-black text-accent text-sm">{prod.pointsCost.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">pts</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Stock: {prod.stock}</span>
                  </div>
                  <Button
                    className={`w-full text-xs font-display ${canAfford ? "btn-spin" : "opacity-50"}`}
                    disabled={!canAfford || prod.stock <= 0}
                    onClick={() => setSelected(prod as Product)}
                  >
                    {!canAfford ? "Puntos insuficientes" : prod.stock <= 0 ? "Sin stock" : "Canjear"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* My redemptions */}
        {myRedemptions && myRedemptions.length > 0 && (
          <div>
            <h2 className="font-display text-xl font-bold text-gold-gradient mb-4">Mis Canjes</h2>
            <div className="space-y-3">
              {myRedemptions.map((r) => (
                <div key={r.id} className="card-fantasy rounded-xl p-4 flex items-center gap-4">
                  <Gift size={24} className="text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">Pedido #{r.id}</p>
                    <p className="text-xs text-muted-foreground">{r.shippingCity}, {r.shippingCountry}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("es-ES")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      r.status === "shipped" ? "bg-green-500/20 text-green-400" :
                      r.status === "delivered" ? "bg-blue-500/20 text-blue-400" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {r.status === "pending" ? "En proceso" : r.status === "shipped" ? "Enviado" : r.status === "delivered" ? "Entregado" : r.status}
                    </span>
                    <p className="text-xs text-accent mt-1">-{r.pointsSpent.toLocaleString()} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Redeem dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setSuccess(false); } }}>
        <DialogContent className="card-fantasy border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-gold-gradient">
              {success ? "¡Canje Exitoso!" : `Canjear: ${selected?.name}`}
            </DialogTitle>
          </DialogHeader>

          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="text-green-400 mx-auto mb-3" size={48} />
              <p className="font-display font-bold text-green-400 text-lg">¡Pedido confirmado!</p>
              <p className="text-muted-foreground text-sm mt-2">Tu producto será enviado en 5-10 días hábiles.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
                <Star size={20} className="text-accent" />
                <div>
                  <p className="text-sm font-bold text-foreground">{selected?.name}</p>
                  <p className="text-xs text-accent font-bold">-{selected?.pointsCost.toLocaleString()} puntos</p>
                </div>
              </div>

              <p className="text-sm font-display font-bold text-foreground">Datos de envío</p>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Nombre completo</Label>
                  <Input className="mt-1 bg-input border-border" placeholder="Tu nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Dirección</Label>
                  <Input className="mt-1 bg-input border-border" placeholder="Calle, número, colonia" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Ciudad</Label>
                    <Input className="mt-1 bg-input border-border" placeholder="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">País</Label>
                    <Input className="mt-1 bg-input border-border" placeholder="País" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">Los puntos no son reembolsables. Envío gratis incluido.</p>

              <Button
                className="w-full btn-spin font-display"
                disabled={redeemMutation.isPending}
                onClick={handleRedeem}
              >
                {redeemMutation.isPending ? "Procesando..." : `Confirmar Canje (${selected?.pointsCost.toLocaleString()} pts)`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
