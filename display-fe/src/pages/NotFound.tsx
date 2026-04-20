import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-muted-foreground">Link yang Anda buka tidak tersedia.</p>
      </div>
      <Button asChild>
        <Link to="/">Kembali ke Dashboard</Link>
      </Button>
    </div>
  );
}

