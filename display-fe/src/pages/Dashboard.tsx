import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Film, Users, Tv, ArrowUpRight, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { getSystem, listCategories, listMedia, listUsers } from "@/lib/backend";
import { useAuth } from "@/contexts/auth-context";

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const { data: settings } = useQuery({ queryKey: ["system"], queryFn: getSystem, staleTime: 30_000 });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const { data: media = [] } = useQuery({ queryKey: ["media"], queryFn: listMedia });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: listUsers, enabled: isAdmin });

  const stats = [
    { label: "Total Kategori", value: categories.length, icon: Package, hint: `${categories.filter(i=>i.isActive).length} aktif` },
    { label: "Total Media", value: media.length, icon: Film, hint: `${media.filter(m=>m.isActive).length} di playlist` },
    { label: "Pengguna", value: isAdmin ? users.length : "-", icon: Users, hint: isAdmin ? `${users.filter(u=>u.isActive).length} aktif` : "admin only" },
    { label: "Rata-rata Harga", value: categories.length ? formatIDR(Math.round(categories.reduce((a,b)=>a+Number(b.price||0),0)/categories.length)) : "-", icon: TrendingUp, hint: "semua kategori" },
  ];

  return (
    <>
      <PageHeader
        title={`${settings?.companyName ? ` ${settings.companyName}` : ""}`}
        description="Kelola kategori, media, user, dan pengaturan display harga emas."
        action={
          <Button asChild>
            <a href="/display" target="_blank" rel="noreferrer">
              <Tv className="mr-2 h-4 w-4" /> Buka Display TV
            </a>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5 border-border/70 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-md)] transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{s.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2 border-border/70">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Kategori Terbaru</h2>
            <Link to="/categories" className="text-xs font-medium text-accent inline-flex items-center gap-1">
              Lihat semua <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {categories.slice(0, 6).map((i) => (
              <div key={i.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.code} · Buyback {formatIDR(i.buybackPrice)}</p>
                </div>
                <p className="text-sm font-semibold text-foreground tabular-nums">{formatIDR(i.price)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 border-border/70">
          <h2 className="text-sm font-semibold text-foreground mb-4">Playlist Aktif</h2>
          <div className="space-y-3">
            {media.filter(m=>m.isActive).map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                  <Film className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{m.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">{m.type}</p>
                </div>
              </div>
            ))}
            {media.filter(m=>m.isActive).length === 0 && (
              <p className="text-xs text-muted-foreground">Belum ada media aktif.</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
