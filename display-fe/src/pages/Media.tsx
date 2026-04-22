import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileVideo, Pencil, PlayCircle, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  createContent,
  deleteContent,
  listContentTypes,
  listContents,
  updateContent,
  type Content,
} from "@/lib/backend";

type ContentDraft = {
  id: string;
  judul_konten: string;
  jenis_konten: string;
  source_url: string;
  deskripsi: string;
  durasi_tampil: string;
  isActive: boolean;
};

const emptyDraft: ContentDraft = {
  id: "",
  judul_konten: "",
  jenis_konten: "",
  source_url: "",
  deskripsi: "",
  durasi_tampil: "",
  isActive: true,
};

export default function MediaPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ContentDraft>(emptyDraft);
  const [confirm, setConfirm] = useState<Content | null>(null);
  const [preview, setPreview] = useState<Content | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: contents = [], isLoading } = useQuery({
    queryKey: ["contents"],
    queryFn: listContents,
  });
  const { data: contentTypes = [] } = useQuery({
    queryKey: ["content-types"],
    queryFn: listContentTypes,
  });
  const filteredContents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return contents.filter((content) => {
      const matchesType = typeFilter === "all" || content.jenis_konten === typeFilter;
      const searchable = [
        content.judul_konten,
        content.jenis_konten,
        content.source_url,
        content.deskripsi,
      ].join(" ").toLowerCase();
      return matchesType && (!query || searchable.includes(query));
    });
  }, [contents, search, typeFilter]);

  const openNew = () => {
    setDraft({ ...emptyDraft, jenis_konten: contentTypes[0]?.jenis_konten || "" });
    setOpen(true);
  };

  const openEdit = (content: Content) => {
    setDraft({
      id: content.id,
      judul_konten: content.judul_konten,
      jenis_konten: content.jenis_konten,
      source_url: content.source_url,
      deskripsi: content.deskripsi || "",
      durasi_tampil: content.durasi_tampil ? String(content.durasi_tampil) : "",
      isActive: content.isActive !== false,
    });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft.judul_konten.trim()) throw new Error("Judul konten wajib diisi");
      if (!draft.jenis_konten.trim()) throw new Error("Jenis konten wajib dipilih");
      if (!draft.source_url.trim()) throw new Error("Source URL wajib diisi");

      const payload = {
        judul_konten: draft.judul_konten.trim(),
        jenis_konten: draft.jenis_konten,
        source_url: draft.source_url.trim(),
        deskripsi: draft.deskripsi.trim(),
        durasi_tampil: draft.durasi_tampil ? Math.max(1, Number(draft.durasi_tampil)) : null,
        isActive: draft.isActive,
      };

      return draft.id ? updateContent(draft.id, payload) : createContent(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contents"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      setOpen(false);
      toast.success("Konten disimpan");
    },
    onError: (error: any) => toast.error(error?.message || "Gagal menyimpan konten"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteContent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contents"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Konten dihapus");
    },
    onError: (error: any) => toast.error(error?.message || "Gagal menghapus konten"),
  });

  const toggleMutation = useMutation({
    mutationFn: async (content: Content & { next: boolean }) => updateContent(content.id, { ...content, isActive: content.next }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contents"] });
      qc.invalidateQueries({ queryKey: ["display"] });
    },
  });

  return (
    <>
      <PageHeader
        title="Master Konten"
        description="Kelola konten yang ingin diputar di Display TV."
      />

      <Card className="mb-4 border-border/70 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-end">
            <div className="w-full md:w-[220px]">
              <Label className="mb-1.5 block text-xs">Jenis Konten</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter jenis konten" />
                </SelectTrigger>
                <SelectContent className="z-[400] border border-border bg-popover text-popover-foreground shadow-2xl">
                  <SelectItem value="all">SEMUA</SelectItem>
                  {contentTypes.map((item) => (
                    <SelectItem key={item.id} value={item.jenis_konten}>
                      {item.jenis_konten}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari judul, deskripsi, URL..."
                  className="pl-9"
                />
              </div>
            </div>
          </div>
          <div className="mt-2 md:mt-0 md:ml-auto">
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Data
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredContents.map((content) => (
          <Card key={content.id} className="overflow-hidden border-border/70">
            <button type="button" className="group block aspect-video w-full overflow-hidden bg-secondary/70 text-left" onClick={() => setPreview(content)}>
              <div className="relative h-full w-full">
                <ContentPoster content={content} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <PlayCircle className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/85 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-amber-300/40 bg-amber-400/25 px-3 py-1 text-xs font-semibold text-amber-50 shadow-[0_0_22px_rgba(251,191,36,0.28)] backdrop-blur">
                    {content.jenis_konten}
                  </span>
                    <span className="text-xs text-white/75">Klik preview</span>
                </div>
                  <p className="mt-4 line-clamp-2 text-lg font-semibold text-white">{content.judul_konten}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-white/70">{content.source_url}</p>
                </div>
              </div>
            </button>
            <div className="p-4">
              <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                {content.deskripsi || "Tanpa deskripsi"}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <Switch
                  checked={content.isActive}
                  onCheckedChange={(value) => toggleMutation.mutate({ ...content, next: value })}
                />
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(content)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setConfirm(content)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {!isLoading && filteredContents.length === 0 ? (
          <Card className="col-span-full border-dashed p-12 text-center">
            <FileVideo className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{contents.length ? "Konten tidak ditemukan" : "Belum ada konten"}</p>
            <p className="text-xs text-muted-foreground">Tambahkan link atau video URL, atau ubah filter pencarian.</p>
          </Card>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit Konten" : "Tambah Konten"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Judul Konten</Label>
                <Input value={draft.judul_konten} onChange={(event) => setDraft({ ...draft, judul_konten: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Jenis Konten</Label>
                <div className="relative">
                  <Select value={draft.jenis_konten} onValueChange={(value) => setDraft({ ...draft, jenis_konten: value })}>
                    <SelectTrigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
                      <SelectValue placeholder="Pilih jenis konten" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-xl">
                      {contentTypes.map((item) => (
                        <SelectItem key={item.id} value={item.jenis_konten}>
                          {item.jenis_konten}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {contentTypes.length === 0 ? (
                    <p className="text-xs text-destructive">Isi Master Jenis Konten terlebih dahulu.</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Source URL</Label>
              <Textarea
                value={draft.source_url}
                onChange={(event) => setDraft({ ...draft, source_url: event.target.value })}
                placeholder="Silakan tempel link atau video url."
                className="min-h-[96px]"
              />
              <p className="text-xs text-muted-foreground">
                Masukkan URL atau link video.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea value={draft.deskripsi} onChange={(event) => setDraft({ ...draft, deskripsi: event.target.value })} placeholder="Opsional" />
              </div>
              {/* Durasi tampil disembunyikan sementara.
                  Logic tetap ada: data lama yang punya durasi tetap dipakai,
                  video tanpa durasi tampil sampai selesai,
                  image/embed tanpa durasi default tampil 10 detik. */}
              {false ? (
              <div className="space-y-2">
                <Label>Durasi Tampil (detik)</Label>
                <Input
                  type="number"
                  min={1}
                  value={draft.durasi_tampil}
                  onChange={(event) => setDraft({ ...draft, durasi_tampil: event.target.value })}
                  placeholder="Opsional"
                />
                <p className="text-xs text-muted-foreground">Opsional. Kosongkan jika ingin tampil sampai video selesai.</p>
              </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Switch checked={draft.isActive} onCheckedChange={(value) => setDraft({ ...draft, isActive: value })} />
              <Label className="!m-0">Aktifkan konten di Display TV</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || contentTypes.length === 0}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(value) => !value && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus konten?</AlertDialogTitle>
            <AlertDialogDescription>Konten yang dihapus tidak bisa dikembalikan.</AlertDialogDescription>
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
            <DialogTitle>Preview Konten</DialogTitle>
          </DialogHeader>
          {preview ? (
            <MediaPreview url={preview.display_url || preview.source_url} title={preview.judul_konten} sourceType={preview.source_type} />
          ) : null}
          <div className="text-sm">
            <p className="font-medium">{preview?.judul_konten}</p>
            <p className="text-xs text-muted-foreground break-all">{preview?.source_url}</p>
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

function ContentPoster({ content }: { content: Content }) {
  const source = content.display_url || content.source_url || "";
  const youtubeId = getYoutubeId(content.source_url);

  if (youtubeId) {
    return <img src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`} alt={content.judul_konten} className="h-full w-full object-cover" />;
  }

  const driveId = getGoogleDriveId(content.source_url);
  if (driveId) {
    return (
      <DrivePoster
        title={content.judul_konten}
        subtitle={content.source_type === "image" ? "Google Drive Image" : "Google Drive Media"}
      />
    );
  }

  if (content.source_type === "image" || /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(source)) {
    return <img src={source} alt={content.judul_konten} className="h-full w-full object-cover" />;
  }

  if (content.source_type === "video" || /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(source)) {
    return <video src={source} className="h-full w-full object-cover" muted playsInline preload="metadata" />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,hsl(var(--accent)/0.35),transparent_32%),linear-gradient(135deg,hsl(var(--secondary)),hsl(var(--card)))]">
      <div className="rounded-2xl border border-border/60 bg-background/70 p-5 text-center shadow-lg backdrop-blur">
        <FileVideo className="mx-auto h-9 w-9 text-accent" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview Konten</p>
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
        <FileVideo className="mx-auto h-10 w-10 text-amber-200" />
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
