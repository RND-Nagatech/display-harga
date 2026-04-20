import { useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, Loader2, Lock, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import loginBg from "@/assets/login-bg.svg";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { getDisplay } from "@/lib/backend";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { login, user } = useAuth();
  const { data: display } = useQuery({
    queryKey: ["display"],
    queryFn: getDisplay,
    staleTime: 30_000,
  });
  const settings = display?.system;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return toast.error("Username & password wajib diisi");
    setLoading(true);
    try {
      await login(username, password, remember);
      const to = (loc.state as any)?.from || "/";
      nav(to);
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left — branding visual (always cinematic dark, theme-independent) */}
      <aside
        className="relative hidden lg:flex flex-col justify-between p-12 text-tv-text overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(230 45% 8% / 0.88), hsl(230 45% 4% / 0.92)), url(${loginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tv-accent/20 text-tv-accent backdrop-blur">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-tv-muted">PriceTV</p>
            <p className="text-base font-semibold">Display Harga untuk Bisnis</p>
          </div>
        </div>

        {/* Glow accents */}
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-tv-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[hsl(192_85%_55%_/_0.18)] blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-[hsl(280_80%_60%_/_0.18)] blur-3xl" />

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Tampilkan harga & promosi Anda dengan cara <span className="tv-price-text">modern</span>.
          </h1>
          <p className="mt-4 text-sm text-tv-muted leading-relaxed">
            Kelola item, media video, dan tayangkan langsung ke layar TV toko Anda. Cepat, rapi, dan terlihat profesional.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { v: "10+", l: "Item siap tayang" },
              { v: "Live", l: "Update real-time" },
              { v: "4K", l: "Siap untuk TV" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-tv-border bg-tv-surface/40 backdrop-blur px-4 py-3">
                <p className="text-xl font-bold text-tv-text">{s.v}</p>
                <p className="text-[10px] uppercase tracking-wider text-tv-muted mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-tv-muted">
          © {new Date().getFullYear()} {settings?.companyName || "PriceTV"}
        </p>
      </aside>

      {/* Right — form */}
      <section className="relative flex items-center justify-center px-6 py-10 sm:px-12">
        {/* Theme toggle floats top-right */}
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="font-semibold">PriceTV</span>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Masuk</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Selamat datang <span className="text-gradient-primary">kembali</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Masuk untuk mengelola item dan tayangan TV Anda.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="contoh: admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      passwordRef.current?.focus();
                    }
                  }}
                  className="pl-9 h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" tabIndex={-1} className="text-xs font-medium text-accent hover:underline">
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  ref={passwordRef}
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
              <Label htmlFor="remember" className="!m-0 text-sm font-normal text-muted-foreground">
                Ingat saya di perangkat ini
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold bg-gradient-primary hover:opacity-90 shadow-glow"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Masuk"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Belum punya akun?{" "}
              <button type="button" className="font-medium text-accent hover:underline">
                Hubungi admin
              </button>
            </p>
          </form>

          <div className="mt-10 pt-6 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
            <span>{settings?.companyCode || ""}</span>
            <a href="/display" className="hover:text-foreground transition-colors">Buka Display TV →</a>
          </div>
        </div>
      </section>
    </div>
  );
}
