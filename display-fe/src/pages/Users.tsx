import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { createUser, deleteUser, listUsers, updateUser } from "@/lib/backend";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

type UserDraft = {
  id: string;
  username: string;
  password: string;
  level: "admin" | "operator";
  isActive: boolean;
};

const empty: UserDraft = { id: "", username: "", password: "", level: "operator", isActive: true };

export default function Users() {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<UserDraft>(empty);
  const [confirm, setConfirm] = useState<UserDraft | null>(null);
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    enabled: isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft.username) throw new Error("Username wajib diisi");
      const payload = {
        username: draft.username,
        password: draft.password,
        level: draft.level,
        isActive: draft.isActive,
      };
      if (draft.id) {
        return updateUser(draft.id, { ...payload, password: draft.password || undefined });
      }
      if (!draft.password) throw new Error("Password wajib diisi");
      return createUser(payload as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      toast.success("User disimpan");
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menyimpan user"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User dihapus");
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menghapus user"),
  });

  const onNew = () => { setDraft({ ...empty, id: "" }); setOpen(true); };
  const onEdit = (u: any) => {
    setDraft({
      id: u.id,
      username: u.username,
      password: "",
      level: u.level,
      isActive: u.isActive !== false,
    });
    setOpen(true);
  };

  if (!isAdmin) {
    return (
      <>
        <PageHeader
          title="Manage User"
          description="Hanya admin yang dapat mengakses menu ini."
        />
        <Card className="p-6 border-border/70 text-sm text-muted-foreground">Access denied.</Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Manage User"
        description="Kelola pengguna yang dapat mengakses sistem."
        action={<Button onClick={onNew}><Plus className="mr-2 h-4 w-4" /> Tambah User</Button>}
      />

      <Card className="border-border/70 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            )}
            {users.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell className="text-muted-foreground font-mono text-xs">{u.username}</TableCell>
                <TableCell><Badge variant="secondary">{u.level === "admin" ? "Admin" : "Operator"}</Badge></TableCell>
                <TableCell>
                  {u.isActive
                    ? <Badge className="bg-success/10 text-success border-0">Aktif</Badge>
                    : <Badge variant="secondary">Nonaktif</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-1 flex-nowrap">
                    <Button size="icon" variant="ghost" onClick={()=>onEdit(u)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={()=>setConfirm({ ...empty, id: u.id, username: u.username, level: u.level, isActive: u.isActive, password: "" })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft.id ? "Edit User" : "Tambah User"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>Username</Label><Input value={draft.username} onChange={(e)=>setDraft({...draft, username:e.target.value.toLowerCase().replace(/\s+/g,"")})} placeholder="contoh: admin" /></div>
            <div>
              <Label>Password {draft.id ? <span className="text-xs text-muted-foreground">(kosongkan jika tidak diganti)</span> : null}</Label>
              <Input type="password" value={draft.password} onChange={(e)=>setDraft({...draft, password:e.target.value})} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={draft.level} onValueChange={(v)=>setDraft({...draft, level: v as any})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={draft.isActive} onCheckedChange={(v)=>setDraft({...draft, isActive:v})} />
              <Label className="!m-0">User aktif</Label>
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
            <AlertDialogTitle>Hapus user?</AlertDialogTitle>
            <AlertDialogDescription>User yang dihapus tidak bisa dikembalikan.</AlertDialogDescription>
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
