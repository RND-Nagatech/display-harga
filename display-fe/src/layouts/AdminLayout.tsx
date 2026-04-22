import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Film,
  Tags,
  Megaphone,
  Tv,
  Users,
  Settings as SettingsIcon,
  Building2,
  CalendarDays,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getSystem } from "@/lib/backend";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/categories", label: "Master Harga Emas", icon: Package },
  { to: "/content-types", label: "Master Jenis Konten", icon: Tags },
  { to: "/media", label: "Master Konten", icon: Film },
  { to: "/promos", label: "Master Promo", icon: Megaphone },
  { to: "/display", label: "Display TV", icon: Tv, external: true },
  { to: "/users", label: "Manage User", icon: Users },
  { to: "/settings", label: "Pengaturan", icon: SettingsIcon },
];

export default function AdminLayout() {
  const loc = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: settings } = useQuery({
    queryKey: ["system"],
    queryFn: getSystem,
    staleTime: 30_000,
  });
  const systemDate = new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const userInitial = (user?.username || "?").slice(0, 1).toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar z-50">
        <div className="flex h-16 items-center gap-3 border-b border-border bg-card px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">Display Harga Emas</p>
            <p className="text-xs font-semibold text-muted-foreground truncate">{settings?.companyName || ""}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = loc.pathname === n.to;
            if (n.to === "/users" && !isAdmin) return null;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                target={n.external ? "_blank" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-accent" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="flex-1">{n.label}</span>
                {n.external && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">tab</span>
                )}
              </NavLink>
            );
          })}
        </nav>

      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 lg:ml-64">
        <header className="fixed top-0 left-0 lg:left-64 w-full lg:w-[calc(100%-16rem)] z-50 hidden h-16 items-center justify-end border-b border-border bg-card/95 px-6 backdrop-blur lg:flex">
          {/* Spacer for fixed header */}
          <div className="h-16 w-full absolute top-0 left-0 pointer-events-none" style={{zIndex: -1}} />
          <div className="flex items-center gap-4">
            <div className="flex h-9 items-center gap-2 rounded-full bg-secondary px-4 text-sm text-foreground">
              <span>Tanggal System : {systemDate}</span>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            <ThemeToggle />
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1 transition-colors hover:bg-secondary/70"
                onClick={() => setUserMenuOpen((current) => !current)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
                  {userInitial}
                </div>
                <div className="min-w-0 pr-1 text-left">
                  <p className="max-w-32 truncate text-xs font-semibold text-foreground">{user?.username}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{user?.level}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {userMenuOpen ? (
                <div className="absolute right-0 top-full z-[200] mt-2 w-36 overflow-hidden rounded-lg border border-border bg-card p-1 shadow-xl">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="lg:hidden flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-semibold">Display Harga Emas</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href="/display" target="_blank" className="text-xs font-medium text-accent">TV →</a>
          </div>
        </div>
        <div className="lg:hidden flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = loc.pathname === n.to;
            if (n.to === "/users" && !isAdmin) return null;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                target={n.external ? "_blank" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {n.label}
              </NavLink>
            );
          })}
        </div>

        <div className="px-6 py-5 lg:px-10 lg:py-4 lg:pt-20 max-w-[1400px] mx-auto animate-fade-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
