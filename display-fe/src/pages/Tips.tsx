import DisplayMediaMasterPage, { buildDisplayMediaMasterConfig } from "./DisplayMediaMasterPage";
import { tipsApi } from "@/lib/backend";

const config = buildDisplayMediaMasterConfig({
  queryKey: "tips",
  title: "Master Tips Emas",
  description: "Tips Membedakan Emas Asli vs Palsu untuk Display TV.",
  badge: "TIPS",
  titleField: "judul_tips",
  titleLabel: "Judul Tips",
  optionalField: "isi_tips",
  optionalLabel: "Isi Tips",
  optionalAsTextarea: true,
  allowTextMedia: true,
  requiredMessage: "Judul tips wajib diisi",
  api: tipsApi,
});

export default function Tips() {
  return <DisplayMediaMasterPage config={config} />;
}
