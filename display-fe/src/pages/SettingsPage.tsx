import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSystem, updateSystem, type SystemSetting } from "@/lib/backend";
import { useAuth } from "@/contexts/auth-context";
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

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [confirmReset, setConfirmReset] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["system"],
    queryFn: getSystem,
  });
  const [draft, setDraft] = useState<SystemSetting>({
    companyCode: "",
    companyName: "",
    address: "",
    phone: "",
    operationalDays: "",
    operationalHours: "",
  });

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => updateSystem(draft),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["system"] });
      qc.invalidateQueries({ queryKey: ["display"] });
      toast.success("Pengaturan disimpan");
    },
    onError: (e: any) => toast.error(e?.message || "Gagal menyimpan pengaturan"),
  });

  return (
    <>
      <PageHeader
        title="Pengaturan Sistem"
        description="Identitas perusahaan Anda yang akan tampil di Display TV dan dokumen."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6 border-border/70">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label>Kode Toko</Label>
                  <Input value={draft.companyCode} onChange={(e)=>setDraft({...draft, companyCode:e.target.value})} placeholder="CMP-001" />
                </div>
                <div>
                  <Label>Nama Toko</Label>
                  <Input value={draft.companyName} onChange={(e)=>setDraft({...draft, companyName:e.target.value})} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Alamat</Label>
                  <Textarea rows={3} value={draft.address} onChange={(e)=>setDraft({...draft, address:e.target.value})} />
                </div>
                <div>
                  <Label>Nomor HP / WhatsApp</Label>
                  <Input value={draft.phone} onChange={(e)=>setDraft({...draft, phone:e.target.value})} placeholder="+62 …" />
                </div>
                <div>
                  <Label>Hari Buka</Label>
                  <Input value={draft.operationalDays} onChange={(e)=>setDraft({...draft, operationalDays:e.target.value})} placeholder="Senin - Sabtu" />
                </div>
                <div>
                  <Label>Jam Buka</Label>
                  <Input value={draft.operationalHours} onChange={(e)=>setDraft({...draft, operationalHours:e.target.value})} placeholder="09.00 - 21.00" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="ghost" onClick={()=>setConfirmReset(true)} disabled={!isAdmin}>Reset</Button>
                <Button onClick={()=>saveMutation.mutate()} disabled={!isAdmin || saveMutation.isPending}>
                  Simpan Pengaturan
                </Button>
              </div>
            </>
          )}
        </Card>

        <Card className="p-6 border-border/70 bg-secondary/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Pratinjau</p>
          <p className="mt-1 text-lg font-semibold">{draft.companyName || "Nama Perusahaan"}</p>
          <p className="text-xs text-muted-foreground mt-1">Kode: {draft.companyCode || "-"}</p>
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-muted-foreground">{draft.address || "Alamat perusahaan"}</p>
            <p className="text-foreground font-medium">{draft.phone || "-"}</p>
            <p className="text-muted-foreground">{draft.operationalDays || "Hari operasional"}</p>
            <p className="text-foreground font-medium">{draft.operationalHours || "Jam operasional"}</p>
          </div>
        </Card>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset pengaturan?</AlertDialogTitle>
            <AlertDialogDescription>
              Ini akan mereset data <code>Perusahaan</code> Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setDraft({ companyCode: "", companyName: "", address: "", phone: "", operationalDays: "", operationalHours: "" });
                updateSystem({ companyCode: "", companyName: "", address: "", phone: "", operationalDays: "", operationalHours: "" })
                  .then(() => {
                    qc.invalidateQueries({ queryKey: ["system"] });
                    qc.invalidateQueries({ queryKey: ["display"] });
                    toast.success("Pengaturan direset");
                  })
                  .catch((e: any) => toast.error(e?.message || "Gagal reset pengaturan"));
              }}
            >
              Ya, reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
