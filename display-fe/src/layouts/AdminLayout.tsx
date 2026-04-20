import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Film,
  Tv,
  Users,
  Settings as SettingsIcon,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getSystem } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/items", label: "Master Item", icon: Package },
  { to: "/media", label: "Master Media", icon: Film },
  { to: "/display", label: "Display TV", icon: Tv, external: true },
  { to: "/users", label: "Manage User", icon: Users },
  { to: "/settings", label: "Pengaturan", icon: SettingsIcon },
];

export default function AdminLayout() {
  const loc = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { data: settings } = useQuery({
    queryKey: ["system"],
    queryFn: getSystem,
    staleTime: 30_000,
  });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">PriceTV</p>
            <p className="text-xs text-muted-foreground truncate">{settings?.companyCode || ""}</p>
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

        <div className="m-3 rounded-xl border border-sidebar-border bg-card p-4 space-y-3">
          {/* <div>
            <p className="text-xs font-medium text-muted-foreground">Perusahaan</p>
            <p className="mt-1 text-sm font-semibold text-foreground line-clamp-1">{settings?.companyName || "-"}</p>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{settings?.address || "-"}</p>
          </div> */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Login</span>
            <span className="text-xs font-semibold text-foreground">{user?.username}</span>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-semibold">PriceTV</span>
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

        <div className="p-6 lg:p-10 max-w-[1400px] mx-auto animate-fade-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
