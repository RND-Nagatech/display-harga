import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Search, Tags, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  createContentType,
  deleteContentType,
  listContentTypes,
  updateContentType,
  type ContentType,
} from "@/lib/backend";

const emptyDraft: ContentType = { id: "", jenis_konten: "" };

export default function ContentTypes() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ContentType>(emptyDraft);
  const [confirm, setConfirm] = useState<ContentType | null>(null);
  const [search, setSearch] = useState("");

  const { data: contentTypes = [], isLoading } = useQuery({
    queryKey: ["content-types"],
    queryFn: listContentTypes,
  });
  const filteredContentTypes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return contentTypes.filter((item) => !query || item.jenis_konten.toLowerCase().includes(query));
  }, [contentTypes, search]);

  const openNew = () => {
    setDraft(emptyDraft);
    setOpen(true);
  };

  const openEdit = (item: ContentType) => {
    setDraft(item);
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft.jenis_konten.trim()) {
        throw new Error("Jenis konten wajib diisi");
      }

      const payload = { jenis_konten: draft.jenis_konten.trim().toUpperCase() };
      return draft.id ? updateContentType(draft.id, payload) : createContentType(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-types"] });
      setOpen(false);
      toast.success("Jenis konten disimpan");
    },
    onError: (error: any) => toast.error(error?.message || "Gagal menyimpan jenis konten"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteContentType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-types"] });
      toast.success("Jenis konten dihapus");
    },
    onError: (error: any) => toast.error(error?.message || "Gagal menghapus jenis konten"),
  });

  return (
    <>
      <PageHeader
        title="Master Jenis Konten"
        description="Kelola jenis konten untuk playlist Display TV."
      />

      <Card className="mb-4 border-border/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari jenis konten..."
              className="pl-9"
            />
          </div>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Data
          </Button>
        </div>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Jenis Konten</TableHead>
            <TableHead className="w-24 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredContentTypes.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Tags className="h-5 w-5" />
                </div>
                <p className="font-medium">{item.jenis_konten}</p>
              </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setConfirm(item)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              </TableCell>
            </TableRow>
          ))}

          {!isLoading && filteredContentTypes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="py-12 text-center text-sm text-muted-foreground">
                {contentTypes.length ? "Jenis konten tidak ditemukan." : "Belum ada jenis konten."}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit Jenis Konten" : "Tambah Jenis Konten"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Jenis Konten</Label>
            <Input
              value={draft.jenis_konten}
              onChange={(event) => setDraft({ ...draft, jenis_konten: event.target.value.toUpperCase() })}
              placeholder="Contoh: VIDEO PROMO, EDUKASI, REELS, GAMBAR"
            />
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
            <AlertDialogTitle>Hapus jenis konten?</AlertDialogTitle>
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
    </>
  );
}
