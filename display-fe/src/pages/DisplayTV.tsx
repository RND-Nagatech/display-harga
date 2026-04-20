import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDisplay, type Item, type Media } from "@/lib/backend";
import { Building2 } from "lucide-react";

const ITEMS_PER_SIDE = 8;
const PAGE_INTERVAL_MS = 8000;

export default function DisplayTV() {
  const { data } = useQuery({
    queryKey: ["display"],
    queryFn: getDisplay,
    refetchInterval: 30_000,
  });

  const items = data?.items || [];
  const media = data?.media || [];
  const settings = data?.system;

  const [page, setPage] = useState(0);
  const perPage = ITEMS_PER_SIDE * 2;
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const pageItems = useMemo(() => slicePage(items, page, perPage), [items, page, perPage]);
  const leftItems = pageItems.slice(0, ITEMS_PER_SIDE);
  const rightItems = pageItems.slice(ITEMS_PER_SIDE, perPage);

  useEffect(() => {
    setPage(0);
  }, [items.length]);

  useEffect(() => {
    const t = window.setInterval(() => setPage((p) => (p + 1) % totalPages), PAGE_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [totalPages]);

  // Clock
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="tv-theme min-h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-tv-border">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tv-accent/15 text-tv-accent">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-tv-muted">{settings?.companyCode || ""}</p>
            <h1 className="text-xl font-semibold text-tv-text">{settings?.companyName || "Display TV"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-tv-muted">{date}</p>
            <p className="text-2xl font-semibold text-tv-text tabular-nums">{time}</p>
          </div>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 grid grid-cols-12 gap-6 px-6 py-6 min-h-0">
        <PriceColumn items={leftItems} side="left" />

        <div className="col-span-6 flex flex-col gap-4 min-h-0">
          <div className="flex-1 rounded-2xl tv-surface tv-glow overflow-hidden relative">
            <MediaPlayer media={media} />
          </div>

          <div className="rounded-xl tv-surface px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-tv-muted">Total Item Tampil</p>
              <p className="text-2xl font-bold text-tv-text">{items.length}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.2em] text-tv-muted">Hubungi Kami</p>
              <p className="text-base font-semibold text-tv-text">{settings?.phone || "-"}</p>
            </div>
          </div>
        </div>

        <PriceColumn items={rightItems} side="right" />
      </div>

      {/* Marquee */}
      <footer className="border-t border-tv-border bg-tv-surface/50 backdrop-blur overflow-hidden">
        <div className="flex whitespace-nowrap py-3 animate-marquee">
          {[...items, ...items].map((i, idx) => (
            <span key={idx} className="flex items-center gap-3 px-8 text-sm">
              <span className="text-tv-muted">{i.code}</span>
              <span className="text-tv-text font-medium">{i.name}</span>
              <span className="tv-price-text font-bold">{formatIDR(i.price)}</span>
              <span className="text-tv-muted">/ {i.unit || "pcs"}</span>
              <span className="text-tv-border">•</span>
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

function PriceColumn({ items, side }: { items: Item[]; side: "left" | "right" }) {
  return (
    <div className="col-span-3 flex flex-col gap-3 min-h-0 overflow-hidden">
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] uppercase tracking-[0.25em] text-tv-muted">
          {side === "left" ? "Daftar Harga" : "Daftar Harga"}
        </p>
        <span className="text-[10px] text-tv-muted">{items.length} item</span>
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        {items.map((i) => (
          <div
            key={i.id}
            className="tv-surface rounded-xl px-4 py-3 flex items-center justify-between hover:border-tv-accent/40 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-mono text-tv-muted">{i.code}</p>
              <p className="text-sm font-semibold text-tv-text truncate">{i.name}</p>
              <p className="text-[10px] text-tv-muted uppercase tracking-wider">{i.category}</p>
            </div>
            <div className="text-right pl-3">
              <p className="tv-price-text text-lg font-extrabold leading-tight tabular-nums">{formatIDR(i.price)}</p>
              <p className="text-[10px] text-tv-muted">/ {i.unit || "pcs"}</p>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="tv-surface rounded-xl flex-1 flex items-center justify-center text-tv-muted text-sm">
            Belum ada item
          </div>
        )}
      </div>
    </div>
  );
}

function MediaPlayer({ media }: { media: Media[] }) {
  const [idx, setIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytTimerRef = useRef<number | null>(null);

  const current = media[idx];
  const embedUrl = useMemo(() => (current?.type === "youtube" ? current.embedUrl : null), [current]);

  useEffect(() => { setIdx(0); }, [media.length]);

  // Auto-advance for YouTube based on durationSec; for local video use 'ended'.
  useEffect(() => {
    if (!current) return;
    if (ytTimerRef.current) { window.clearTimeout(ytTimerRef.current); ytTimerRef.current = null; }

    if (current.type === "youtube") {
      const ms = (current.durationSec ?? 30) * 1000;
      ytTimerRef.current = window.setTimeout(() => {
        setIdx((i) => (i + 1) % Math.max(media.length, 1));
      }, ms);
    }
    return () => { if (ytTimerRef.current) window.clearTimeout(ytTimerRef.current); };
  }, [current, media.length]);

  if (!current) {
    return (
      <div className="h-full w-full flex items-center justify-center text-tv-muted">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.25em]">Tidak ada media aktif</p>
          <p className="text-xs mt-2">Tambahkan media di menu Master Media.</p>
        </div>
      </div>
    );
  }

  if (current.type === "youtube" && embedUrl) {
    return (
      <iframe
        key={current.id + idx}
        className="h-full w-full"
        src={embedUrl}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title={current.label}
      />
    );
  }

  return (
    <video
      key={current.id + idx}
      ref={videoRef}
      src={current.url}
      autoPlay
      muted
      playsInline
      onEnded={() => setIdx((i) => (i + 1) % Math.max(media.length, 1))}
      className="h-full w-full object-cover"
    />
  );
}

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function slicePage(items: Item[], page: number, pageSize: number) {
  const start = page * pageSize;
  return items.slice(start, start + pageSize);
}
