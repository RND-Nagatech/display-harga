import { useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Upload, Youtube, FileVideo, PlayCircle } from "lucide-react";
import { toast } from "sonner";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createYoutubeMedia, deleteMedia, listMedia, updateMedia, uploadMedia, type Media } from "@/lib/backend";
import { youtubeIdFromUrl } from "@/lib/youtube";
import {
  Dialog as PreviewDialog,
  DialogContent as PreviewDialogContent,
  DialogHeader as PreviewDialogHeader,
  DialogTitle as PreviewDialogTitle,
} from "@/components/ui/dialog";

type MediaDraft = {
  id: string;
  title: string;
  type: "local" | "youtube";
  src: string;
  durationSec: number;
  active: boolean;
  file?: File | null;
};

const empty: MediaDraft = { id: "", title: "", type: "youtube", src: "", durationSec: 30, active: true, file: null };

export default function MediaPage() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<MediaDraft>(empty);
  const [confirm, setConfirm] = useState<Media | null>(null);
  const [preview, setPreview] = useState<Media | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data: media = [], isLoading } = useQuery({
    queryKey: ["media"],
    queryFn: listMedia,
  });

  const openNew = (type: MediaDraft["type"]) => { setDraft({ ...empty, id: "", type }); setOpen(true); };
  const openEdit = (m: Media) => {
    setDraft({
      id: m.id,
      title: m.label,
      type: m.type === "youtube" ? "youtube" : "local",
      src: m.type === "youtube" ? (m.sourceUrl || "") : (m.url || ""),
      durationSec: Number(m.durationSec || 30),
      active: m.isActive !== false,
      file: null,
    });
    setOpen(true);
  };

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setDraft((d) => ({ ...d, src: url, title: d.title || file.name.replace(/\.[^.]+$/, ""), file }));
    toast.success("File dipilih");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft.title) throw new Error("Judul wajib diisi");
      if (!draft.src && !draft.file) throw new Error("Sumber media kosong");
      if (draft.type === "youtube") {
        if (!youtubeIdFromUrl(draft.src)) throw new Error("Link YouTube tidak valid");
        if (draft.id) {
          return updateMedia(draft.id, {
            label: draft.title,
            isActive: draft.active,
            durationSec: draft.durationSec,
            sourceUrl: draft.src,
          } as any);
        }
        return createYoutubeMedia(draft.title, draft.src, draft.durationSec, draft.active);
      }

      // local
      if (draft.id) {
        return updateMedia(draft.id, { label: draft.title, isActive: draft.active } as any);
      }
      if (!draft.file) throw new Error("File wajib dipilih");
      return uploadMedia(draft.title, draft.file, draft.active);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      setOpen(false);
      toast.success("Media disimpan");
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menyimpan media"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteMedia(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Media dihapus");
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menghapus media"),
  });

  const toggleMutation = useMutation({
    mutationFn: async (m: Media & { next: boolean }) => updateMedia(m.id, { isActive: m.next } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
      qc.invalidateQueries({ queryKey: ["display"] });
    },
  });

  return (
    <>
      <PageHeader
        title="Master Media"
        description="Tambahkan link YouTube. Akan diputar bergantian di Display TV."
        action={
          <div className="flex gap-2">
            {/* Upload lokal disembunyikan sementara. Logic uploadMedia/handleFile tetap dipertahankan agar mudah diaktifkan lagi.
            <Button variant="outline" onClick={() => openNew("local")}><Upload className="mr-2 h-4 w-4" /> Upload Lokal</Button>
            */}
            <Button onClick={() => openNew("youtube")}><Youtube className="mr-2 h-4 w-4" /> YouTube</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {media.map((m) => {
          const ytId = m.type === "youtube" ? youtubeIdFromUrl(m.sourceUrl || "") : null;
          const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
          return (
            <Card key={m.id} className="overflow-hidden border-border/70 group">
              <button
                type="button"
                className="aspect-video bg-secondary relative w-full text-left"
                onClick={() => setPreview(m)}
              >
                {thumb ? (
                  <img src={thumb} alt={m.label} className="h-full w-full object-cover" />
                ) : m.type === "file" && m.url ? (
                  <video src={m.url} className="h-full w-full object-cover" muted />
                ) : (
                  <div className="flex h-full items-center justify-center"><FileVideo className="h-10 w-10 text-muted-foreground" /></div>
                )}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                  <PlayCircle className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border-0 backdrop-blur">
                  {m.type === "youtube" ? "YouTube" : "Lokal"}
                </Badge>
              </button>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.type === "youtube" ? m.sourceUrl : m.url}</p>
                  </div>
                  {m.isActive
                    ? <Badge className="bg-success/10 text-success border-0">Aktif</Badge>
                    : <Badge variant="secondary">Off</Badge>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Switch checked={m.isActive} onCheckedChange={(v)=>toggleMutation.mutate({ ...m, next: v } as any)} />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={()=>openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={()=>setConfirm(m)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {!isLoading && media.length === 0 && (
          <Card className="col-span-full p-12 text-center border-dashed">
            <FileVideo className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="mt-3 text-sm font-medium">Belum ada media</p>
            <p className="text-xs text-muted-foreground">Tambahkan video lokal atau link YouTube untuk mulai.</p>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{draft.id ? "Edit Media" : "Tambah Media"}</DialogTitle></DialogHeader>
          <Tabs value={draft.type} onValueChange={(v)=>setDraft({...draft, type: v as MediaDraft["type"], src: "", file: null })}>
            <TabsList className="grid grid-cols-1 w-full">
              {/* Upload lokal disembunyikan sementara. Buka kembali blok ini jika fitur file lokal ingin dipakai lagi.
              <TabsTrigger value="local"><Upload className="mr-2 h-4 w-4" />File Lokal</TabsTrigger>
              */}
              <TabsTrigger value="youtube"><Youtube className="mr-2 h-4 w-4" />YouTube</TabsTrigger>
            </TabsList>

            {/* Upload lokal disembunyikan sementara. Logic upload tetap ada di file ini dan backend.
            <TabsContent value="local" className="space-y-4 mt-4">
              <div>
                <Label>Pilih file video</Label>
                <input ref={fileRef} type="file" accept="video/*" hidden
                  onChange={(e)=> e.target.files?.[0] && handleFile(e.target.files[0])} />
                <Button variant="outline" className="w-full mt-1" onClick={()=>fileRef.current?.click()} disabled={Boolean(draft.id)}>
                  <Upload className="mr-2 h-4 w-4" /> {draft.src ? "Ganti file" : "Pilih file"}
                </Button>
                {draft.id ? (
                  <p className="text-xs text-muted-foreground mt-2">Edit media lokal hanya mengubah judul & status (tanpa ganti file).</p>
                ) : null}
                {draft.src && draft.type === "local" && !draft.id && (
                  <video src={draft.src} controls className="mt-3 w-full rounded-md aspect-video" />
                )}
              </div>
            </TabsContent>
            */}

            <TabsContent value="youtube" className="space-y-4 mt-4">
              <div>
                <Label>Link YouTube</Label>
                <Input value={draft.src} onChange={(e)=>setDraft({...draft, src:e.target.value})} placeholder="https://www.youtube.com/watch?v=..." />
              </div>
              <div>
                <Label>Durasi (detik)</Label>
                <Input type="number" value={draft.durationSec ?? 30} onChange={(e)=>setDraft({...draft, durationSec:Number(e.target.value)})} />
                <p className="text-xs text-muted-foreground mt-1">Berapa lama video diputar sebelum lanjut ke media berikutnya.</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-3 pt-2">
            <div><Label>Judul</Label><Input value={draft.title} onChange={(e)=>setDraft({...draft, title:e.target.value})} /></div>
            <div className="flex items-center gap-3">
              <Switch checked={draft.active} onCheckedChange={(v)=>setDraft({...draft, active:v})} />
              <Label className="!m-0">Masukkan ke playlist Display TV</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={()=>setOpen(false)}>Batal</Button>
            <Button onClick={()=>saveMutation.mutate()} disabled={saveMutation.isPending}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus media?</AlertDialogTitle>
            <AlertDialogDescription>Media yang dihapus tidak bisa dikembalikan.</AlertDialogDescription>
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

      <PreviewDialog open={Boolean(preview)} onOpenChange={(v) => !v && setPreview(null)}>
        <PreviewDialogContent className="max-w-4xl">
          <PreviewDialogHeader>
            <PreviewDialogTitle>Preview Media</PreviewDialogTitle>
          </PreviewDialogHeader>
          {preview ? (
            <div className="aspect-video w-full overflow-hidden rounded-md bg-secondary">
              {preview.type === "youtube" && preview.embedUrl ? (
                <iframe
                  className="h-full w-full"
                  src={preview.embedUrl}
                  title={preview.label}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : preview.type === "file" && preview.url ? (
                <video className="h-full w-full" src={preview.url} controls autoPlay />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">Tidak ada media</div>
              )}
            </div>
          ) : null}
          <div className="text-sm">
            <p className="font-medium">{preview?.label}</p>
            <p className="text-xs text-muted-foreground truncate">{preview?.type === "youtube" ? preview?.sourceUrl : preview?.url}</p>
          </div>
        </PreviewDialogContent>
      </PreviewDialog>
    </>
  );
}
