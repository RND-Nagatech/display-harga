import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
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
import { createItem, deleteItem, listItems, updateItem, type Item } from "@/lib/backend";
import { toast } from "sonner";

type ItemDraft = {
  id: string;
  code: string;
  name: string;
  category: string;
  price: string;
  unit: string;
  isActive: boolean;
};

const empty: ItemDraft = { id: "", code: "", name: "", category: "", price: "", unit: "pcs", isActive: true };

export default function Items() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ItemDraft>(empty);
  const [confirm, setConfirm] = useState<Item | null>(null);
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: listItems,
  });
  const filtered = useMemo(
    () =>
      items.filter((i) => [i.code, i.name, i.category].join(" ").toLowerCase().includes(q.toLowerCase())),
    [items, q]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft.code || !draft.name) throw new Error("Kode & nama wajib diisi");
      const payload = {
        code: draft.code,
        name: draft.name,
        category: draft.category,
        price: Number(draft.price || 0),
        unit: draft.unit || "pcs",
        isActive: draft.isActive,
      };
      return draft.id ? updateItem(draft.id, payload) : createItem(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      setOpen(false);
      toast.success("Item disimpan");
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menyimpan item"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Item dihapus");
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menghapus item"),
  });

  const onNew = () => { setDraft({ ...empty, id: "" }); setOpen(true); };
  const onEdit = (i: Item) => {
    setDraft({
      id: i.id,
      code: i.code,
      name: i.name,
      category: i.category || "",
      price: String(i.price ?? ""),
      unit: i.unit || "pcs",
      isActive: i.isActive !== false,
    });
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Master Item"
        description="Kelola daftar barang dan harga yang akan tampil di Display TV."
        action={
          <Button onClick={onNew}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Item
          </Button>
        }
      />

      <Card className="border-border/70 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kode, nama, kategori…" className="pl-9" />
          </div>
          <p className="text-xs text-muted-foreground">{filtered.length} item</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead>Satuan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            )}
            {filtered.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{i.code}</TableCell>
                <TableCell className="font-medium">{i.name}</TableCell>
                <TableCell><Badge variant="secondary" className="font-normal">{i.category}</Badge></TableCell>
                <TableCell className="text-right tabular-nums font-semibold">{formatIDR(i.price)}</TableCell>
                <TableCell className="text-muted-foreground">{i.unit}</TableCell>
                <TableCell>
                  {i.isActive
                    ? <Badge className="bg-success/10 text-success hover:bg-success/15 border-0">Aktif</Badge>
                    : <Badge variant="secondary">Nonaktif</Badge>}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" onClick={() => onEdit(i)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setConfirm(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">Tidak ada item.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft.id ? "Edit Item" : "Tambah Item"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kode</Label><Input value={draft.code} onChange={(e)=>setDraft({...draft, code:e.target.value})} placeholder="BRG-001" /></div>
              <div><Label>Kategori</Label><Input value={draft.category} onChange={(e)=>setDraft({...draft, category:e.target.value})} placeholder="Sembako" /></div>
            </div>
            <div><Label>Nama</Label><Input value={draft.name} onChange={(e)=>setDraft({...draft, name:e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Harga (IDR)</Label><Input type="number" value={draft.price} onChange={(e)=>setDraft({...draft, price:e.target.value})} /></div>
              <div><Label>Satuan</Label><Input value={draft.unit} onChange={(e)=>setDraft({...draft, unit:e.target.value})} placeholder="pcs / kg / btl" /></div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={draft.isActive} onCheckedChange={(v)=>setDraft({...draft, isActive:v})} />
              <Label className="!m-0">Tampilkan di Display TV</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={()=>setOpen(false)}>Batal</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus item?</AlertDialogTitle>
            <AlertDialogDescription>
              Data yang dihapus tidak bisa dikembalikan.
            </AlertDialogDescription>
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

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
