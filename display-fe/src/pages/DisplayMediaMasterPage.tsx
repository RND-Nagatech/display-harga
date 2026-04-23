import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlay, Pencil, PlayCircle, Plus, Search, Trash2, Upload } from "lucide-react";
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
import { uploadAsset, type DisplayMasterItem } from "@/lib/backend";

type MasterApi = {
  list: () => Promise<DisplayMasterItem[]>;
  create: (payload: Partial<DisplayMasterItem>) => Promise<DisplayMasterItem>;
  update: (id: string, payload: Partial<DisplayMasterItem>) => Promise<DisplayMasterItem>;
  delete: (id: string) => Promise<unknown>;
};

type MasterConfig = {
  queryKey: string;
  title: string;
  description: string;
  badge: string;
  titleField: keyof DisplayMasterItem;
  titleLabel: string;
  optionalField: keyof DisplayMasterItem;
  optionalLabel: string;
  optionalAsTextarea?: boolean;
  allowTextMedia?: boolean;
  defaultMediaType?: "image" | "video" | "text";
  requiredMessage: string;
  api: MasterApi;
};

const mediaDefaults: Pick<
  DisplayMasterItem,
  "media_opsional" | "media_type" | "media_source_mode" | "media_link_source" | "text_style" | "isActive"
> = {
  media_opsional: "",
  media_type: "video",
  media_source_mode: "attach_link",
  media_link_source: "youtube",
  text_style: "gold",
  isActive: true,
};

export default function DisplayMediaMasterPage({ config }: { config: MasterConfig }) {
  const qc = useQueryClient();
  const mediaFileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DisplayMasterItem>(() => buildEmptyDraft(config));
  const [confirm, setConfirm] = useState<DisplayMasterItem | null>(null);
  const [preview, setPreview] = useState<DisplayMasterItem | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [config.queryKey],
    queryFn: config.api.list,
  });

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "on" ? item.isActive !== false : item.isActive === false);
      if (!matchesStatus) return false;
      if (!query) return true;
      return [
        getStringValue(item, config.titleField),
        getStringValue(item, config.optionalField),
        item.media_opsional,
      ].join(" ").toLowerCase().includes(query);
    });
  }, [config.optionalField, config.titleField, rows, search, statusFilter]);

  const openNew = () => {
    setDraft(buildEmptyDraft(config));
    setOpen(true);
  };

  const openEdit = (item: DisplayMasterItem) => {
    setDraft({
      ...buildEmptyDraft(config),
      ...item,
      media_type: item.media_type || (item.source_type === "text" ? "text" : item.source_type === "image" ? "image" : "video"),
      media_source_mode: item.media_source_mode || (item.media_opsional?.includes("/uploads/") ? "upload_file" : "attach_link"),
      media_link_source: item.media_link_source || inferLinkSource(item.media_opsional),
      text_style: item.text_style || "gold",
    });
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!getStringValue(draft, config.titleField).trim()) throw new Error(config.requiredMessage);
      const isText = config.allowTextMedia && draft.media_type === "text";
      if (isText && !getStringValue(draft, config.optionalField).trim()) throw new Error(`${config.optionalLabel} wajib diisi untuk tipe TEXT`);
      if (!isText && !draft.media_opsional.trim()) throw new Error("Media wajib diisi");

      const payload: Partial<DisplayMasterItem> = {
        [config.titleField]: getStringValue(draft, config.titleField).trim(),
        [config.optionalField]: getStringValue(draft, config.optionalField).trim(),
        media_opsional: isText ? "" : draft.media_opsional.trim(),
        media_type: draft.media_type || "video",
        media_source_mode: isText ? "attach_link" : draft.media_source_mode || "attach_link",
        media_link_source: !isText && draft.media_source_mode === "attach_link" ? draft.media_link_source || "" : "",
        text_style: draft.text_style || "gold",
        isActive: draft.isActive,
      };

      return draft.id ? config.api.update(draft.id, payload) : config.api.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [config.queryKey] });
      qc.invalidateQueries({ queryKey: ["display"] });
      setOpen(false);
      toast.success("Data disimpan");
    },
    onError: (error: any) => toast.error(error?.message || "Gagal menyimpan data"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => config.api.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [config.queryKey] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Data dihapus");
    },
    onError: (error: any) => toast.error(error?.message || "Gagal menghapus data"),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => uploadAsset(file),
    onSuccess: (result, file) => {
      setDraft((current) => ({
        ...current,
        media_opsional: result.url,
        media_source_mode: "upload_file",
        media_link_source: "",
        media_type: file.type.startsWith("image/") ? "image" : "video",
      }));
      toast.success("Media berhasil diupload");
    },
    onError: (error: any) => toast.error(error?.message || "Gagal upload media"),
  });

  const toggleMutation = useMutation({
    mutationFn: async (item: DisplayMasterItem & { next: boolean }) => config.api.update(item.id, { ...item, isActive: item.next }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [config.queryKey] });
      qc.invalidateQueries({ queryKey: ["display"] });
    },
  });

  return (
    <>
      <PageHeader title={config.title} description={config.description} />

      <Card className="mb-4 border-border/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-3 sm:max-w-2xl sm:flex-row">
            <div className="w-full sm:w-40">
              <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Status Aktif</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">SEMUA</SelectItem>
                  <SelectItem value="on">ON</SelectItem>
                  <SelectItem value="off">OFF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full self-end">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={`Cari ${config.title.toLowerCase()}, media...`}
                className="pl-9"
              />
            </div>
          </div>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Data
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredRows.map((item) => (
          <Card key={item.id} className="overflow-hidden border-border/70">
            <button type="button" className="group block aspect-video w-full overflow-hidden bg-secondary/70 text-left" onClick={() => setPreview(item)}>
              <div className="relative h-full w-full">
                <Poster item={item} title={getStringValue(item, config.titleField)} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <PlayCircle className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/85 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <span className="rounded-full border border-amber-300/40 bg-amber-400/25 px-3 py-1 text-xs font-semibold text-amber-50 shadow-[0_0_22px_rgba(251,191,36,0.28)] backdrop-blur">
                    {config.badge}
                  </span>
                  <p className="mt-4 line-clamp-2 text-lg font-semibold text-white">{getStringValue(item, config.titleField)}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-white/70">{item.media_opsional || "Tanpa media"}</p>
                </div>
              </div>
            </button>
            <div className="p-4">
              <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                {getStringValue(item, config.optionalField) || "Tanpa deskripsi"}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <Switch
                  checked={item.isActive}
                  onCheckedChange={(value) => toggleMutation.mutate({ ...item, next: value })}
                />
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setConfirm(item)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {!isLoading && filteredRows.length === 0 ? (
          <Card className="col-span-full border-dashed p-12 text-center">
            <ImagePlay className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{rows.length ? "Data tidak ditemukan" : "Belum ada data"}</p>
            <p className="text-xs text-muted-foreground">Tambahkan data atau ubah kata kunci pencarian.</p>
          </Card>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100vh-64px)] max-w-2xl overflow-y-auto p-0">
          <DialogHeader>
            <DialogTitle className="px-6 pt-6 md:px-8 md:pt-8">{draft.id ? `Edit ${config.title}` : `Tambah ${config.title}`}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-5 md:px-8 md:py-6">
            <div className="space-y-2">
              <Label>{config.titleLabel}</Label>
              <Input
                value={getStringValue(draft, config.titleField)}
                onChange={(event) => setDraft({ ...draft, [config.titleField]: event.target.value })}
              />
            </div>
            {!config.allowTextMedia ? <OptionalField config={config} draft={draft} setDraft={setDraft} /> : null}

            <div className="space-y-3 rounded-2xl border border-border/70 p-4">
              <div>
                <Label>Source Media</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    variant="outline"
                    className={getModeButtonClass(draft.media_type !== "text" && draft.media_source_mode === "upload_file")}
                    onClick={() => setDraft({ ...draft, media_type: draft.media_type === "text" ? "video" : draft.media_type, media_source_mode: "upload_file", media_link_source: "" })}
                  >
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={getModeButtonClass(draft.media_type !== "text" && draft.media_source_mode === "attach_link")}
                    onClick={() => setDraft({ ...draft, media_type: draft.media_type === "text" ? "video" : draft.media_type, media_source_mode: "attach_link", media_link_source: draft.media_link_source || "youtube" })}
                  >
                    Attach Link
                  </Button>
                  {config.allowTextMedia ? (
                    <Button
                      type="button"
                      variant="outline"
                      className={getModeButtonClass(draft.media_type === "text")}
                      onClick={() => setDraft({ ...draft, media_type: "text", media_opsional: "", media_source_mode: "attach_link", media_link_source: "" })}
                    >
                      Text Slide
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipe Media</Label>
                  <Select
                    value={draft.media_type || "video"}
                    onValueChange={(value: "image" | "video" | "text") =>
                      setDraft({
                        ...draft,
                        media_type: value,
                        media_opsional: value === "text" ? "" : draft.media_opsional,
                        media_link_source: value === "text" ? "" : draft.media_link_source || "youtube",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe media" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Gambar</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      {config.allowTextMedia ? <SelectItem value="text">Text</SelectItem> : null}
                    </SelectContent>
                  </Select>
                </div>

                {draft.media_type === "text" ? (
                  <div className="space-y-2">
                    <Label>Style Text</Label>
                    <TextStyleSelect value={draft.text_style || "gold"} onChange={(value) => setDraft({ ...draft, text_style: value })} />
                  </div>
                ) : draft.media_source_mode === "attach_link" ? (
                  <div className="space-y-2">
                    <Label>Sumber Link</Label>
                    <Select
                      value={draft.media_link_source || "youtube"}
                      onValueChange={(value: "youtube" | "firebase" | "google_drive") =>
                        setDraft({ ...draft, media_link_source: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih sumber link" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="firebase">Firebase</SelectItem>
                        <SelectItem value="google_drive">Google Drive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>

              {config.allowTextMedia && draft.media_type === "text" ? (
                <OptionalField config={config} draft={draft} setDraft={setDraft} required />
              ) : null}

              {draft.media_type === "text" ? (
                <TextSlidePreview title={getStringValue(draft, config.titleField) || config.title} description={getStringValue(draft, config.optionalField)} styleName={draft.text_style || "gold"} />
              ) : draft.media_source_mode === "upload_file" ? (
                <div className="space-y-2">
                  <Label>Media</Label>
                  <input
                    ref={mediaFileRef}
                    type="file"
                    accept="image/*,video/*"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadMutation.mutate(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full border-2 bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100 hover:border-sky-400 shadow-none dark:bg-sky-900 dark:border-sky-500 dark:text-sky-100 dark:hover:bg-sky-800 ${uploadMutation.isPending ? "opacity-60 cursor-not-allowed" : ""}`}
                    onClick={() => mediaFileRef.current?.click()}
                    disabled={uploadMutation.isPending}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadMutation.isPending ? "Uploading..." : "Pilih Media dari Komputer"}
                  </Button>
                  <Input value={draft.media_opsional} readOnly placeholder="URL media hasil upload akan muncul di sini" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Source URL</Label>
                  <Textarea
                    value={draft.media_opsional}
                    onChange={(event) => setDraft({ ...draft, media_opsional: event.target.value })}
                    placeholder="Tempel link YouTube, Firebase Storage, atau Google Drive public."
                    className="min-h-[64px] md:min-h-[80px]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Switch checked={draft.isActive} onCheckedChange={(value) => setDraft({ ...draft, isActive: value })} />
              <Label className="!m-0">Aktifkan di Display TV</Label>
            </div>
          </div>
          <DialogFooter className="border-t border-border/70 px-6 py-4 md:px-8">
            <Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(value) => !value && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data?</AlertDialogTitle>
            <AlertDialogDescription>Data yang dihapus tidak bisa dikembalikan.</AlertDialogDescription>
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
            <DialogTitle>Preview Media</DialogTitle>
          </DialogHeader>
          {preview ? (
            <MediaPreview
              url={preview.display_url || preview.media_opsional}
              title={getStringValue(preview, config.titleField)}
              sourceType={preview.source_type}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function buildDisplayMediaMasterConfig(config: MasterConfig) {
  return config;
}

function buildEmptyDraft(config: MasterConfig): DisplayMasterItem {
  const defaultMediaType = config.defaultMediaType || "video";
  return {
    id: "",
    [config.titleField]: "",
    [config.optionalField]: "",
    ...mediaDefaults,
    media_type: defaultMediaType,
    media_source_mode: defaultMediaType === "text" ? "attach_link" : mediaDefaults.media_source_mode,
    media_link_source: defaultMediaType === "text" ? "" : mediaDefaults.media_link_source,
  };
}

function getStringValue(item: DisplayMasterItem, field: keyof DisplayMasterItem) {
  return String(item[field] || "");
}

function OptionalField({
  config,
  draft,
  setDraft,
  required = false,
}: {
  config: MasterConfig;
  draft: DisplayMasterItem;
  setDraft: (value: DisplayMasterItem) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {config.optionalLabel}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {config.optionalAsTextarea ? (
        <Textarea
          value={getStringValue(draft, config.optionalField)}
          onChange={(event) => setDraft({ ...draft, [config.optionalField]: event.target.value })}
          placeholder={required ? "Wajib diisi untuk tipe TEXT" : "Opsional"}
          className="min-h-[84px] md:min-h-[104px]"
        />
      ) : (
        <Input
          value={getStringValue(draft, config.optionalField)}
          onChange={(event) => setDraft({ ...draft, [config.optionalField]: event.target.value })}
          placeholder={required ? "Wajib diisi untuk tipe TEXT" : "Opsional"}
        />
      )}
    </div>
  );
}

function TextStyleSelect({
  value,
  onChange,
}: {
  value: NonNullable<DisplayMasterItem["text_style"]>;
  onChange: (value: NonNullable<DisplayMasterItem["text_style"]>) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Pilih style text" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="gold">Luxury Gold</SelectItem>
        <SelectItem value="midnight">Midnight Premium</SelectItem>
        <SelectItem value="emerald">Emerald Trust</SelectItem>
        <SelectItem value="light">Clean Light</SelectItem>
      </SelectContent>
    </Select>
  );
}

function TextSlidePreview({ title, description, styleName }: { title: string; description: string; styleName: string }) {
  return (
    <div className={`relative aspect-video overflow-hidden rounded-2xl border p-6 ${getTextSlideClass(styleName)}`}>
      <div className="absolute inset-0 opacity-50 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_26%),radial-gradient(circle_at_82%_78%,rgba(255,255,255,0.16),transparent_28%)]" />
      <div className="relative flex h-full flex-col justify-center">
        <h3 className="line-clamp-2 text-3xl font-black tracking-[-0.06em]">{title}</h3>
        <p className="mt-4 line-clamp-4 max-w-xl text-base font-semibold leading-relaxed opacity-80">
          {description || "Isi/deskripsi akan tampil sebagai slide premium di Display TV."}
        </p>
      </div>
    </div>
  );
}

function getTextSlideClass(styleName = "gold") {
  if (styleName === "light") return "border-slate-200 bg-gradient-to-br from-white via-slate-100 to-amber-50 text-slate-950";
  if (styleName === "emerald") return "border-emerald-300/35 bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-800 text-emerald-50";
  if (styleName === "midnight") return "border-sky-300/25 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-sky-50";
  return "border-amber-300/35 bg-gradient-to-br from-[#17120a] via-[#35250c] to-[#070604] text-amber-50";
}

function getModeButtonClass(active: boolean) {
  return active
    ? "border-2 border-sky-300 bg-sky-50 text-sky-900 ring-2 ring-sky-400 dark:bg-sky-900 dark:border-sky-500 dark:text-sky-100 dark:ring-sky-400 hover:bg-sky-100 hover:border-sky-400 dark:hover:bg-sky-800 shadow-none"
    : "border-2 border-border bg-white text-sky-900 dark:bg-zinc-900 dark:text-sky-100 hover:bg-sky-50 hover:border-sky-300 dark:hover:bg-zinc-800 shadow-none";
}

function MediaPreview({ url, title, sourceType }: { url?: string; title: string; sourceType?: string }) {
  const source = url || "";
  const type = sourceType || detectPreviewType(source);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-md bg-secondary">
      {type === "text" ? (
        <TextSlidePreview title={title} description="Preview text slide" styleName="gold" />
      ) : type === "image" ? (
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

function Poster({ item, title }: { item: DisplayMasterItem; title: string }) {
  const source = item.display_url || item.media_opsional || "";
  const youtubeId = getYoutubeId(item.media_opsional);

  if (item.source_type === "text" || item.media_type === "text") {
    return <TextSlidePreview title={title} description={getTextDescription(item)} styleName={item.text_style || "gold"} />;
  }

  if (youtubeId) {
    return <img src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`} alt={title} className="h-full w-full object-cover" />;
  }

  if (item.source_type === "image" || /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(source)) {
    return <img src={source} alt={title} className="h-full w-full object-cover" />;
  }

  if (item.source_type === "video" || /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(source)) {
    return <video src={source} className="h-full w-full object-cover" muted playsInline preload="metadata" />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,hsl(var(--accent)/0.35),transparent_32%),linear-gradient(135deg,hsl(var(--secondary)),hsl(var(--card)))]">
      <div className="rounded-2xl border border-border/60 bg-background/70 p-5 text-center shadow-lg backdrop-blur">
        <ImagePlay className="mx-auto h-9 w-9 text-accent" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview Media</p>
      </div>
    </div>
  );
}

function getTextDescription(item: DisplayMasterItem) {
  return (
    item.isi_edukasi ||
    item.isi_tips ||
    item.isi_testimoni ||
    item.isi_insight ||
    item.deskripsi_simulasi ||
    item.isi_info ||
    item.kategori_produk ||
    ""
  );
}

function detectPreviewType(url: string) {
  const cleanUrl = url.split("?")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(cleanUrl)) return "image";
  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(cleanUrl)) return "video";
  return "embed";
}

function inferLinkSource(url = ""): DisplayMasterItem["media_link_source"] {
  if (getYoutubeId(url)) return "youtube";
  if (getGoogleDriveId(url)) return "google_drive";
  if (/firebase|firebasestorage\.googleapis\.com/i.test(url)) return "firebase";
  return "youtube";
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
