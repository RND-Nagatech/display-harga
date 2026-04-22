import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Pencil, PlayCircle, Plus, Search, Trash2, Upload } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createPromo, deletePromo, listPromos, updatePromo, uploadAsset, type Promo } from "@/lib/backend";

type PromoDraft = Promo;

const emptyDraft: PromoDraft = {
  id: "",
  judul_promo: "",
  deskripsi_promo: "",
  banner_opsional: "",
  media_opsional: "",
  isActive: true,
};

export default function Promos() {
  const qc = useQueryClient();
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PromoDraft>(emptyDraft);
  const [confirm, setConfirm] = useState<Promo | null>(null);
  const [preview, setPreview] = useState<Promo | null>(null);
  const [search, setSearch] = useState("");

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ["promos"],
    queryFn: listPromos,
  });
  const filteredPromos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return promos.filter((promo) =>
      !query ||
      [
        promo.judul_promo,
        promo.deskripsi_promo,
        promo.banner_opsional,
        promo.media_opsional,
      ].join(" ").toLowerCase().includes(query)
    );
  }, [promos, search]);

  const openNew = () => {
    setDraft(emptyDraft);
    setOpen(true);
  };

  const openEdit = (promo: Promo) => {
    setDraft(promo);
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft.judul_promo.trim()) throw new Error("Judul promo wajib diisi");
      const payload = {
        judul_promo: draft.judul_promo.trim(),
        deskripsi_promo: draft.deskripsi_promo?.trim() || "",
        banner_opsional: draft.banner_opsional?.trim() || "",
        media_opsional: draft.media_opsional?.trim() || "",
        isActive: draft.isActive,
      };
      return draft.id ? updatePromo(draft.id, payload) : createPromo(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promos"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      setOpen(false);
      toast.success("Promo disimpan");
    },
    onError: (error: any) => toast.error(error?.message || "Gagal menyimpan promo"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deletePromo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promos"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Promo dihapus");
    },
    onError: (error: any) => toast.error(error?.message || "Gagal menghapus promo"),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => uploadAsset(file),
    onSuccess: (result) => {
      setDraft((current) => ({ ...current, banner_opsional: result.url }));
      toast.success("Banner berhasil diupload");
    },
    onError: (error: any) => toast.error(error?.message || "Gagal upload banner"),
  });

  const toggleMutation = useMutation({
    mutationFn: async (promo: Promo & { next: boolean }) => updatePromo(promo.id, { ...promo, isActive: promo.next }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promos"] });
      qc.invalidateQueries({ queryKey: ["display"] });
    },
  });

  return (
    <>
      <PageHeader
        title="Master Promo"
        description="Kelola Promo yang ingin tampil di Display TV."
      />

      <Card className="mb-4 border-border/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari judul promo, deskripsi, banner, atau media..."
              className="pl-9"
            />
          </div>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Data
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredPromos.map((promo) => (
          <Card key={promo.id} className="overflow-hidden border-border/70">
            <button type="button" className="group block aspect-video w-full overflow-hidden bg-secondary/70 text-left" onClick={() => setPreview(promo)}>
              <div className="relative h-full w-full">
                <PromoPoster promo={promo} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <PlayCircle className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/85 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <span className="rounded-full border border-amber-300/40 bg-amber-400/25 px-3 py-1 text-xs font-semibold text-amber-50 shadow-[0_0_22px_rgba(251,191,36,0.28)] backdrop-blur">
                    PROMO
                  </span>
                  <p className="mt-4 line-clamp-2 text-lg font-semibold text-white">{promo.judul_promo}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-white/70">
                    {promo.media_opsional || promo.banner_opsional || "Tanpa media/banner"}
                  </p>
                </div>
              </div>
            </button>
            <div className="p-4">
              <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                {promo.deskripsi_promo || "Tanpa deskripsi"}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <Switch
                  checked={promo.isActive}
                  onCheckedChange={(value) => toggleMutation.mutate({ ...promo, next: value })}
                />
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(promo)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setConfirm(promo)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {!isLoading && filteredPromos.length === 0 ? (
          <Card className="col-span-full border-dashed p-12 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{promos.length ? "Promo tidak ditemukan" : "Belum ada promo"}</p>
            <p className="text-xs text-muted-foreground">Tambahkan promo atau ubah kata kunci pencarian.</p>
          </Card>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit Promo" : "Tambah Promo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Judul Promo</Label>
              <Input value={draft.judul_promo} onChange={(event) => setDraft({ ...draft, judul_promo: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi Promo</Label>
              <Textarea value={draft.deskripsi_promo} onChange={(event) => setDraft({ ...draft, deskripsi_promo: event.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Banner (Opsional)</Label>
                <input
                  ref={bannerFileRef}
                  type="file"
                  accept="image/*,video/*"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadMutation.mutate(file);
                  }}
                />
                <Textarea
                  value={draft.banner_opsional}
                  onChange={(event) => setDraft({ ...draft, banner_opsional: event.target.value })}
                  placeholder="Masukkan URL banner/gambar/video jika ada."
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => bannerFileRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadMutation.isPending ? "Uploading..." : "Upload Banner"}
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Media (Opsional)</Label>
                <Textarea
                  value={draft.media_opsional}
                  onChange={(event) => setDraft({ ...draft, media_opsional: event.target.value })}
                  placeholder="URL video, YouTube, Google Drive, Instagram, Firebase, atau CDN."
                />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Switch checked={draft.isActive} onCheckedChange={(value) => setDraft({ ...draft, isActive: value })} />
              <Label className="!m-0">Aktifkan promo di Display TV</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(value) => !value && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus promo?</AlertDialogTitle>
            <AlertDialogDescription>Promo yang dihapus tidak bisa dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirm && deleteMutation.mutate(confirm.id)}
            >
              Ya, hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(preview)} onOpenChange={(value) => !value && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview Promo</DialogTitle>
          </DialogHeader>
          {preview ? (
            <MediaPreview
              url={preview.display_url || preview.media_opsional || preview.banner_opsional}
              title={preview.judul_promo}
              sourceType={preview.source_type}
            />
          ) : null}
          <div className="text-sm">
            <p className="font-medium">{preview?.judul_promo}</p>
            <p className="text-xs text-muted-foreground break-all">{preview?.media_opsional || preview?.banner_opsional}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MediaPreview({ url, title, sourceType }: { url?: string; title: string; sourceType?: string }) {
  const source = url || "";
  const type = sourceType || detectPreviewType(source);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-md bg-secondary">
      {type === "image" ? (
        <img src={source} alt={title} className="h-full w-full object-contain" />
      ) : type === "video" || /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(source) ? (
        <video className="h-full w-full" src={source} controls autoPlay />
      ) : source ? (
        <iframe
          className="h-full w-full"
          src={source}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Tidak ada media</div>
      )}
    </div>
  );
}

function PromoPoster({ promo }: { promo: Promo }) {
  const source = promo.display_url || promo.media_opsional || promo.banner_opsional || "";
  const youtubeId = getYoutubeId(promo.media_opsional || promo.banner_opsional);

  if (youtubeId) {
    return <img src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`} alt={promo.judul_promo} className="h-full w-full object-cover" />;
  }

  const driveId = getGoogleDriveId(promo.media_opsional || promo.banner_opsional);
  if (driveId) {
    return <DrivePoster title={promo.judul_promo} subtitle="Google Drive Promo" />;
  }

  if (promo.source_type === "image" || /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(source)) {
    return <img src={source} alt={promo.judul_promo} className="h-full w-full object-cover" />;
  }

  if (promo.source_type === "video" || /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(source)) {
    return <video src={source} className="h-full w-full object-cover" muted playsInline preload="metadata" />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,hsl(var(--accent)/0.35),transparent_32%),linear-gradient(135deg,hsl(var(--secondary)),hsl(var(--card)))]">
      <div className="rounded-2xl border border-border/60 bg-background/70 p-5 text-center shadow-lg backdrop-blur">
        <Megaphone className="mx-auto h-9 w-9 text-accent" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview Promo</p>
      </div>
    </div>
  );
}

function DrivePoster({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_28%_20%,rgba(251,191,36,0.34),transparent_30%),linear-gradient(135deg,#151515,#2b2414_48%,#090909)]">
      <div className="absolute -left-10 top-8 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-sky-300/10 blur-3xl" />
      <div className="relative rounded-2xl border border-amber-300/25 bg-black/35 px-6 py-5 text-center shadow-2xl backdrop-blur-md">
        <Megaphone className="mx-auto h-10 w-10 text-amber-200" />
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.28em] text-amber-100">Drive Preview</p>
        <p className="mt-2 max-w-56 truncate text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs text-white/60">{subtitle}</p>
      </div>
    </div>
  );
}

function detectPreviewType(url: string) {
  const cleanUrl = url.split("?")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(cleanUrl)) return "image";
  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(cleanUrl)) return "video";
  return "embed";
}

function getYoutubeId(url = "") {
  const patterns = [
    /youtu\.be\/([^?&/]+)/,
    /youtube\.com\/watch\?v=([^?&/]+)/,
    /youtube\.com\/embed\/([^?&/]+)/,
    /youtube\.com\/shorts\/([^?&/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
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
