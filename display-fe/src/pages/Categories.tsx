import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type Category,
} from "@/lib/backend";
import { toast } from "sonner";

type CategoryDraft = {
  id: string;
  code: string;
  name: string;
  price: string;
  buybackPrice: string;
  isActive: boolean;
};

const empty: CategoryDraft = {
  id: "",
  code: "",
  name: "",
  price: "",
  buybackPrice: "",
  isActive: true,
};


export default function Categories() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CategoryDraft>(empty);
  const [confirm, setConfirm] = useState<Category | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const qc = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });
  const filtered = useMemo(
    () =>
      categories.filter((i) => [i.code, i.name].join(" ").toLowerCase().includes(q.toLowerCase())),
    [categories, q]
  );

  // Pagination logic
  const totalPage = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft.code || !draft.name) throw new Error("Kode kategori & nama kategori wajib diisi");
      const payload = {
        code: draft.code,
        name: draft.name,
        price: parseRupiahInput(draft.price),
        buybackPrice: parseRupiahInput(draft.buybackPrice),
        isActive: draft.isActive,
      };
      return draft.id ? updateCategory(draft.id, payload) : createCategory(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      setOpen(false);
      toast.success("Kategori disimpan");
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menyimpan kategori"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Kategori dihapus");
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menghapus kategori"),
  });

  const onNew = () => { setDraft({ ...empty, id: "" }); setOpen(true); };
  const onEdit = (i: Category) => {
    setDraft({
      id: i.id,
      code: i.code,
      name: i.name,
      price: formatRupiahInput(i.price),
      buybackPrice: formatRupiahInput(i.buybackPrice),
      isActive: i.isActive !== false,
    });
    setOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Master Harga Emas"
        description="Kelola Harga Emas untuk Display TV."
      />

      <Card className="border-border/70 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kode atau nama harga emas..." className="pl-9" />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={onNew}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Data
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Kode Kategori</TableHead>
              <TableHead>Nama Kategori</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead className="text-right">Harga Buyback</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">Loading...</TableCell></TableRow>
            )}
            {paged.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{i.code}</TableCell>
                <TableCell className="font-medium">{i.name}</TableCell>
                <TableCell className="text-right tabular-nums font-normal">{formatIDR(i.price)}</TableCell>
                <TableCell className="text-right tabular-nums font-normal">{formatIDR(i.buybackPrice)}</TableCell>
                <TableCell>
                  {i.isActive
                    ? <Badge className="bg-success/10 text-success hover:bg-success/15 border-0 font-medium">Aktif</Badge>
                    : <Badge variant="secondary" className="font-medium">Nonaktif</Badge>}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="icon" variant="outline" onClick={() => onEdit(i)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="outline-destructive" onClick={() => setConfirm(i)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && paged.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground">Tidak ada kategori.</TableCell></TableRow>
            )}

          </TableBody>
        </Table>

        {/* Pagination controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px" }}>
          <div>
            <label htmlFor="perPage" style={{ fontSize: 13, marginRight: 8 }}>Tampil:</label>
            <select
              id="perPage"
              value={perPage}
              onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
              style={{ border: "1px solid #ddd", borderRadius: 6, padding: "2px 8px", fontSize: 13 }}
            >
              {[10, 20, 50, 100].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(1)}>&laquo;</Button>
            <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>&lsaquo;</Button>
            <span style={{ fontSize: 13 }}>Halaman {page} dari {totalPage}</span>
            <Button size="sm" variant="ghost" disabled={page === totalPage} onClick={() => setPage(page + 1)}>&rsaquo;</Button>
            <Button size="sm" variant="ghost" disabled={page === totalPage} onClick={() => setPage(totalPage)}>&raquo;</Button>
          </div>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft.id ? "Edit Data" : "Tambah Data"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kode Kategori</Label><Input value={draft.code} onChange={(e)=>setDraft({...draft, code:e.target.value.toUpperCase()})} placeholder="24K" /></div>
              <div><Label>Nama Kategori</Label><Input value={draft.name} onChange={(e)=>setDraft({...draft, name:e.target.value})} placeholder="Antam Certi Eye RM" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Harga (IDR)</Label>
                <Input
                  inputMode="numeric"
                  value={draft.price}
                  onChange={(e)=>setDraft({...draft, price:formatRupiahInput(e.target.value)})}
                  placeholder="5.000.000"
                />
              </div>
              <div>
                <Label>Harga Buyback (IDR)</Label>
                <Input
                  inputMode="numeric"
                  value={draft.buybackPrice}
                  onChange={(e)=>setDraft({...draft, buybackPrice:formatRupiahInput(e.target.value)})}
                  placeholder="4.800.000"
                />
              </div>
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
            <AlertDialogTitle>Hapus kategori?</AlertDialogTitle>
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

function parseRupiahInput(value: string | number) {
  const digitsOnly = String(value ?? "").replace(/\D/g, "");
  return Number(digitsOnly || 0);
}

function formatRupiahInput(value: string | number) {
  const numericValue = parseRupiahInput(value);
  if (!numericValue) {
    return "";
  }

  return numericValue.toLocaleString("id-ID");
}
