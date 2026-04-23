import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock3, Maximize2, MessageCircle, Store } from "lucide-react";
import { getDisplay, type Category, type Media } from "@/lib/backend";
import goldHeroImage from "@/assets/gold-tv-hero.png";
import "./DisplayTVMonolith.css";

const DEFAULT_REFRESH_INTERVAL = 300_000;
const CLOCK_INTERVAL = 1_000;
const HIGHLIGHT_INTERVAL = 5_000;
const PAGE_ROTATE_INTERVAL = 8_000;
const ROWS_PER_SIDE = 8;

type PriceGroup = {
  id: string;
  kode_group: string;
  nama_group: string;
  harga: number;
  harga_buyback: number;
};

export default function DisplayTV() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["display"],
    queryFn: getDisplay,
    refetchInterval: (query) => getDisplayRefreshInterval(query.state.data?.system?.displayRefreshMinutes),
  });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [isHeroMediaReady, setIsHeroMediaReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [driveFallbackIds, setDriveFallbackIds] = useState<Set<string>>(() => new Set());
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const settings = data?.system;
  const tokoName = settings?.companyName?.trim() || "DISPLAY HARGA EMAS";
  const currentYear = new Date().getFullYear();

  const groups = useMemo(() => normalizeCategories(data?.categories || []), [data?.categories]);
  const heroMedia = useMemo(() => (data?.media || []).filter((item) => item.isActive !== false), [data?.media]);
  const activeHeroMedia = heroMedia[mediaIndex] || null;
  const activeDriveUrl = getGoogleDriveUrl(activeHeroMedia);
  const shouldUseDriveFallback = Boolean(activeHeroMedia && driveFallbackIds.has(activeHeroMedia.id));

  useEffect(() => {
    document.body.classList.add("tv-monolith-active");
    return () => document.body.classList.remove("tv-monolith-active");
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "f") {
        requestFullscreen();
      }
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (data) {
      setLastUpdated(new Date());
    }
  }, [data]);

  useEffect(() => {
    setPageIndex(0);
    setHighlightIndex(0);
  }, [groups.length]);

  useEffect(() => {
    if (groups.length <= 1) {
      setHighlightIndex(0);
      return undefined;
    }

    const highlightTimer = window.setInterval(() => {
      setHighlightIndex((current) => (current + 1) % groups.length);
    }, HIGHLIGHT_INTERVAL);

    return () => window.clearInterval(highlightTimer);
  }, [groups.length]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(groups.length / (ROWS_PER_SIDE * 2)));

    if (pageIndex >= totalPages) {
      setPageIndex(0);
    }

    if (totalPages <= 1) {
      return undefined;
    }

    const pageTimer = window.setInterval(() => {
      setPageIndex((current) => (current + 1) % totalPages);
    }, PAGE_ROTATE_INTERVAL);

    return () => window.clearInterval(pageTimer);
  }, [groups.length, pageIndex]);

  useEffect(() => {
    if (mediaIndex >= heroMedia.length) {
      setMediaIndex(0);
    }
  }, [heroMedia.length, mediaIndex]);

  useEffect(() => {
    setIsHeroMediaReady(!activeHeroMedia);
  }, [activeHeroMedia?.id]);

  useEffect(() => {
    if (!activeHeroMedia || heroMedia.length <= 1) {
      return undefined;
    }

    let timer: number | undefined;

    if (activeHeroMedia.type === "image") {
      timer = window.setTimeout(() => {
        setMediaIndex((current) => (current + 1) % heroMedia.length);
      }, 10000);
    } else if (activeHeroMedia.durationSec && activeHeroMedia.durationSec > 0) {
      timer = window.setTimeout(() => {
        setMediaIndex((current) => (current + 1) % heroMedia.length);
      }, activeHeroMedia.durationSec * 1000);
    }
    // Untuk video/youtube, tidak ada timer, hanya lanjut via onEnded

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [activeHeroMedia?.id, heroMedia.length]);

  useEffect(() => {
    if (!activeHeroMedia || !activeDriveUrl || shouldUseDriveFallback || isHeroMediaReady) {
      return undefined;
    }

    const fallbackTimer = window.setTimeout(() => {
      fallbackToDrivePreview(activeHeroMedia.id);
    }, 4500);

    return () => window.clearTimeout(fallbackTimer);
  }, [activeHeroMedia, activeDriveUrl, shouldUseDriveFallback, isHeroMediaReady]);

  const highestPrice = useMemo(() => {
    if (!groups.length) {
      return null;
    }

    return groups.reduce<PriceGroup | null>(
      (currentMax, item) => (!currentMax || item.harga > currentMax.harga ? item : currentMax),
      null,
    );
  }, [groups]);

  const highlightedGroup = groups[highlightIndex] || groups[0] || null;
  const pagedGroups = useMemo(() => {
    const pageSize = ROWS_PER_SIDE * 2;
    const startIndex = pageIndex * pageSize;
    return groups.slice(startIndex, startIndex + pageSize);
  }, [groups, pageIndex]);
  const leftGroups = pagedGroups.slice(0, ROWS_PER_SIDE);
  const rightGroups = pagedGroups.slice(ROWS_PER_SIDE, ROWS_PER_SIDE * 2);
  const tickerGroups = useMemo(() => groups.slice(0, 8), [groups]);
  const statusText = isError ? "Koneksi bermasalah" : lastUpdated ? "Sinkron otomatis aktif" : "Menunggu data";
  const headlineText = "MURNI • ELEGAN • BERNILAI TINGGI";
  const headlineScale = getHeadlineScale(headlineText);
  const youtubeEmbedUrl = buildYoutubeEmbedUrl(activeHeroMedia, heroMedia);
  const heroSourceUrl = getHeroSourceUrl(activeHeroMedia);

  const goToNextMedia = () => {
    if (heroMedia.length <= 1) {
      return;
    }

    setIsHeroMediaReady(false);
    setMediaIndex((current) => (current + 1) % heroMedia.length);
  };

  const fallbackToDrivePreview = (mediaId?: string) => {
    if (!mediaId) return;
    setDriveFallbackIds((current) => {
      const next = new Set(current);
      next.add(mediaId);
      return next;
    });
    setIsHeroMediaReady(false);
  };

  const requestFullscreen = () => {
    const target = document.documentElement;
    if (!document.fullscreenElement && target.requestFullscreen) {
      target.requestFullscreen().catch(() => undefined);
    }
  };

  return (
    <div className="tv-monolith-screen" onDoubleClick={requestFullscreen}>
      {!isFullscreen ? (
        <button
          type="button"
          className="tv-monolith-fullscreen-badge"
          onClick={requestFullscreen}
          aria-label="Fullscreen TV"
        >
          <Maximize2 className="h-3 w-3" />
          <span className="sr-only">Fullscreen TV</span>
        </button>
      ) : null}

      <div className="tv-monolith-ambient tv-monolith-ambient-left" />
      <div className="tv-monolith-ambient tv-monolith-ambient-right" />

      <header className="tv-monolith-topbar">
        <div className="tv-monolith-brand-block">
          <div className="tv-monolith-brand">{tokoName}</div>
        </div>

        <div className="tv-monolith-market-block">
          <div className="tv-monolith-market-title">Live Market Data</div>
          <DisplayClock />
        </div>
      </header>

      <main className="tv-monolith-main">
        <div className="tv-monolith-left">
          <PriceTable title="Price Overview" rows={leftGroups} pageKey={`left-${pageIndex}`} />
        </div>

        <section className="tv-monolith-center">
          <div className="tv-monolith-hero">
            <div className={`tv-monolith-hero-media ${activeHeroMedia && !isHeroMediaReady ? "is-media-loading" : ""}`.trim()}>
              {!activeHeroMedia || !isHeroMediaReady ? <HeroFallback /> : null}

              {activeHeroMedia && activeDriveUrl && !shouldUseDriveFallback ? (
                <video
                  key={`${activeHeroMedia.id}-${mediaIndex}-drive-direct`}
                  ref={videoRef}
                  src={toGoogleDriveDirectUrl(activeDriveUrl)}
                  className="tv-monolith-hero-video"
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  controls={false}
                  loop={heroMedia.length === 1}
                  onCanPlay={() => setIsHeroMediaReady(true)}
                  onLoadedData={() => setIsHeroMediaReady(true)}
                  onEnded={goToNextMedia}
                  onError={() => fallbackToDrivePreview(activeHeroMedia.id)}
                />
              ) : activeHeroMedia?.type === "youtube" && youtubeEmbedUrl ? (
                <iframe
                  key={`${activeHeroMedia.id}-${mediaIndex}`}
                  src={youtubeEmbedUrl}
                  className="tv-monolith-hero-video tv-monolith-hero-youtube"
                  title={activeHeroMedia.label || "YouTube Hero"}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() => setIsHeroMediaReady(true)}
                />
              ) : activeHeroMedia?.type === "image" && heroSourceUrl ? (
                <img
                  key={`${activeHeroMedia.id}-${mediaIndex}`}
                  src={heroSourceUrl}
                  className="tv-monolith-hero-video"
                  alt={activeHeroMedia.label || "Konten Display TV"}
                  onLoad={() => setIsHeroMediaReady(true)}
                  onError={goToNextMedia}
                />
              ) : activeHeroMedia?.type === "embed" && heroSourceUrl ? (
                <iframe
                  key={`${activeHeroMedia.id}-${mediaIndex}`}
                  src={heroSourceUrl}
                  className="tv-monolith-hero-video tv-monolith-hero-youtube"
                  title={activeHeroMedia.label || "Konten Display TV"}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() => setIsHeroMediaReady(true)}
                />
              ) : activeHeroMedia ? (
                <video
                  key={`${activeHeroMedia.id}-${mediaIndex}`}
                  ref={videoRef}
                  src={heroSourceUrl}
                  className="tv-monolith-hero-video"
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  controls={false}
                  loop={heroMedia.length === 1}
                  onCanPlay={() => setIsHeroMediaReady(true)}
                  onLoadedData={() => setIsHeroMediaReady(true)}
                  onEnded={goToNextMedia}
                  onError={goToNextMedia}
                />
              ) : null}
            </div>

            {!activeHeroMedia ? <HeroFallback /> : null}

            {!activeHeroMedia || !isHeroMediaReady ? (
              <>
                <div className="tv-monolith-spot-card">
                  <GoldOrbit className="is-card" />
                  <div className="tv-monolith-spot-label">Harga Emas Tertinggi</div>
                  <div className="tv-monolith-spot-price">{formatCurrency(highestPrice?.harga)}</div>
                  <div className="tv-monolith-spot-meta">{highestPrice?.kode_group || "Belum tersedia"}</div>
                </div>

                <div className="tv-monolith-hero-copy">
                  <h1 style={{ "--headline-scale": headlineScale } as React.CSSProperties}>{headlineText}</h1>
                  <p>Keunggulan Nilai Emas Terbaik.</p>
                </div>
              </>
            ) : null}
          </div>

          <div className="tv-monolith-info-cards">
            <article className="tv-monolith-info-card">
              <div className="tv-monolith-info-icon">●</div>
              <h3>Status</h3>
              <p>{statusText}</p>
            </article>

            <article className="tv-monolith-info-card is-highlight">
              <div className="tv-monolith-info-icon">●</div>
              <h3>Highlight Harga</h3>
              <p>
                {highlightedGroup?.kode_group || "Belum ada"}{" "}
                {highlightedGroup ? `- ${formatCurrency(highlightedGroup.harga)}` : ""}
              </p>
            </article>

            <article className="tv-monolith-info-card" id="highlight-buyback-card">
              <div className="tv-monolith-info-icon">●</div>
              <h3>Buyback</h3>
              <p>
                {highlightedGroup?.kode_group || "Belum ada"}{" "}
                {highlightedGroup ? `- ${formatCurrency(highlightedGroup.harga_buyback)}` : ""}
              </p>
            </article>
          </div>
        </section>

        <div className="tv-monolith-right">
          <PriceTable title="Price Overview" rows={rightGroups} pageKey={`right-${pageIndex}`} />
        </div>
      </main>

      <div className="tv-monolith-service-strip">
        <div className="tv-monolith-service-item is-status">
          <span className={`tv-monolith-status-dot ${isError ? "is-error" : "is-ok"}`} />
          <span>{statusText}</span>
        </div>
        <div className="tv-monolith-service-separator" />
        <div className="tv-monolith-service-item">
          <MessageCircle className="tv-monolith-service-icon is-whatsapp" />
          <span>Whatsapp: {formatWhatsapp(settings?.phone)}</span>
        </div>
        <div className="tv-monolith-service-separator" />
        <div className="tv-monolith-service-item">
          <Clock3 className="tv-monolith-service-icon is-clock" />
          <span>Jam Operasional: {formatOperational(settings?.operationalDays, settings?.operationalHours)}</span>
        </div>
        <div className="tv-monolith-service-separator" />
        <div className="tv-monolith-service-item">
          <Store className="tv-monolith-service-icon is-store" />
          <span>Melayani Jual • Beli • Tukar Tambah</span>
        </div>
        <div className="tv-monolith-service-separator" />
        <div className="tv-monolith-service-item is-update">
          <span>{isLoading ? "Memuat data..." : `Update terakhir ${formatClock(lastUpdated)}`}</span>
        </div>
      </div>

      <div className="tv-monolith-bottom-strip">
        <RunningTicker items={tickerGroups} />
      </div>

      <footer className="tv-monolith-footer tv-monolith-footer-copyright">
        <div className="tv-monolith-copyright">©Nagatech Sistem Integrator - {currentYear}</div>
      </footer>
    </div>
  );
}

function PriceTable({ title, rows, pageKey }: { title: string; rows: PriceGroup[]; pageKey: string }) {
  return (
    <section className="tv-monolith-table">
      <div className="tv-monolith-table-heading">
        <span className="tv-monolith-table-bar" />
        <h2>{title === "Price Overview" ? "Harga Emas Terkini" : title}</h2>
      </div>

      <div className="tv-monolith-buyback-note">
        <span>*</span>
        Harga buyback menyesuaikan kondisi barang.
      </div>

      <div className="tv-monolith-table-head">
        <span>Kategori</span>
        <span>Harga</span>
        <span>Buyback</span>
      </div>

      <div className="tv-monolith-table-list" key={`${title}-${pageKey}`}>
        {rows.length > 0 ? (
          rows.map((item, index) => (
            <article
              className={`tv-monolith-table-row ${index === 0 ? "is-featured" : ""}`}
              key={`${item.id}-${pageKey}`}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <GoldOrbit className="is-row" />
              <span className="tv-monolith-table-kode">{item.kode_group}</span>
              <span className="tv-monolith-table-price">{formatPrice(item.harga)}</span>
              <span className="tv-monolith-table-buyback">
                {formatPrice(item.harga_buyback)}
                {item.harga_buyback > 0 && (
                  <span style={{ color: '#ff3b3b', fontWeight: 700, marginLeft: 2 }}>*</span>
                )}
              </span>
            </article>
          ))
        ) : (
          <div className="tv-monolith-table-empty">Data Harga Emas</div>
        )}
      </div>
    </section>
  );
}

const RunningTicker = memo(function RunningTicker({ items }: { items: PriceGroup[] }) {
  const tickerItems = items.length > 0
    ? [...items, ...items]
    : [{ id: "empty", kode_group: "INFO", nama_group: "Data belum tersedia", harga: 0, harga_buyback: 0 }];

  return (
    <div className="tv-monolith-ticker">
      <div className="tv-monolith-ticker-track">
        {tickerItems.map((item, index) => (
          <div className="tv-monolith-ticker-item" key={`${item.id}-${index}`}>
            <span className="tv-monolith-ticker-kode">{item.kode_group}</span>
            <span className="tv-monolith-ticker-name">{shortenName(item.nama_group, 20)}</span>
            <span className="tv-monolith-ticker-price">{formatCurrency(item.harga)}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

function DisplayClock() {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const clockTimer = window.setInterval(() => setCurrentTime(new Date()), CLOCK_INTERVAL);
    return () => window.clearInterval(clockTimer);
  }, []);

  return <div className="tv-monolith-market-subtitle">{formatDateTime(currentTime)}</div>;
}

function HeroFallback() {
  return (
    <div className="tv-monolith-hero-image tv-monolith-hero-fallback">
      <img src={goldHeroImage} alt="Kotak perhiasan emas" className="tv-monolith-hero-photo" />
    </div>
  );
}

function GoldOrbit({ className = "" }: { className?: string }) {
  return (
    <div className={`tv-gold-frame ${className}`.trim()} aria-hidden="true">
      <div className="tv-gold-frame-top">
        <span>GOLD</span><span>GOLD</span><span>GOLD</span><span>GOLD</span>
      </div>
      <div className="tv-gold-frame-right">
        <span>GOLD</span><span>GOLD</span><span>GOLD</span><span>GOLD</span>
      </div>
      <div className="tv-gold-frame-bottom">
        <span>GOLD</span><span>GOLD</span><span>GOLD</span><span>GOLD</span>
      </div>
      <div className="tv-gold-frame-left">
        <span>GOLD</span><span>GOLD</span><span>GOLD</span><span>GOLD</span>
      </div>
    </div>
  );
}

function normalizeCategories(categories: Category[]): PriceGroup[] {
  return categories
    .filter((item) => item.isActive !== false && item.code?.trim())
    .map((item) => ({
      id: item.id,
      kode_group: item.code.trim(),
      nama_group: item.name?.trim() || "-",
      harga: Number.isFinite(Number(item.price)) ? Number(item.price) : 0,
      harga_buyback: Number.isFinite(Number(item.buybackPrice)) ? Number(item.buybackPrice) : 0,
    }))
    .sort((left, right) => {
      const codeCompare = left.kode_group.localeCompare(right.kode_group, "id", {
        sensitivity: "base",
        numeric: true,
      });

      if (codeCompare !== 0) {
        return codeCompare;
      }

      return left.nama_group.localeCompare(right.nama_group, "id", {
        sensitivity: "base",
        numeric: true,
      });
    });
}

function buildYoutubeEmbedUrl(activeMedia: Media | null, allMedia: Media[]) {
  if (!activeMedia || activeMedia.type !== "youtube") {
    return "";
  }

  const activeId = getYoutubeId(activeMedia.embedUrl || activeMedia.sourceUrl || activeMedia.url || "");
  if (!activeId) {
    return activeMedia.embedUrl || "";
  }

  const playlist = allMedia
    .filter((item) => item.type === "youtube")
    .map((item) => getYoutubeId(item.embedUrl || item.sourceUrl || item.url || ""))
    .filter(Boolean)
    .join(",");

  return `https://www.youtube.com/embed/${activeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${playlist || activeId}&rel=0&modestbranding=1&playsinline=1`;
}

function getHeroSourceUrl(activeMedia: Media | null) {
  if (!activeMedia) {
    return "";
  }

  return activeMedia.displayUrl || activeMedia.embedUrl || activeMedia.url || activeMedia.sourceUrl || "";
}

function getGoogleDriveUrl(activeMedia: Media | null) {
  const source = activeMedia?.sourceUrl || activeMedia?.url || activeMedia?.displayUrl || activeMedia?.embedUrl || "";
  return source.includes("drive.google.com") ? source : "";
}

function toGoogleDriveDirectUrl(url: string) {
  const id = getGoogleDriveId(url);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
}

function getGoogleDriveId(url = "") {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("drive.google.com")) return "";
    const fileMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    if (fileMatch?.[1]) return fileMatch[1];
    return parsed.searchParams.get("id") || "";
  } catch {
    return "";
  }
}

function getYoutubeId(url: string) {
  const patterns = [
    /youtu\.be\/([^?&/]+)/,
    /youtube\.com\/watch\?v=([^?&/]+)/,
    /youtube\.com\/embed\/([^?&/]+)/,
    /youtube\.com\/shorts\/([^?&/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function getHeadlineScale(value: string) {
  if (value.length >= 26) return 0.58;
  if (value.length >= 22) return 0.68;
  if (value.length >= 18) return 0.8;
  return 1;
}

function getDisplayRefreshInterval(minutes?: number | null) {
  const numericValue = Number(minutes);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return DEFAULT_REFRESH_INTERVAL;
  }

  return Math.max(1, Math.min(1440, Math.round(numericValue))) * 60_000;
}

function formatPrice(value?: number | null) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  return numericValue.toLocaleString("id-ID");
}

function formatCurrency(value?: number | null) {
  if (!Number.isFinite(Number(value))) {
    return "Rp -";
  }

  return `Rp ${formatPrice(value)}`;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}

function formatClock(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(value);
}

function formatWhatsapp(value?: string) {
  const phone = String(value || "").trim();
  return phone || "-";
}

function formatOperational(days?: string, hours?: string) {
  const dayText = String(days || "").trim();
  const hourText = String(hours || "").trim();
  if (dayText && hourText) return `${dayText}, ${hourText}`;
  return dayText || hourText || "-";
}

function shortenName(value: string, maxLength = 22) {
  if (!value) {
    return "-";
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}
