import DisplayMediaMasterPage, { buildDisplayMediaMasterConfig } from "./DisplayMediaMasterPage";
import { infoBuybackApi } from "@/lib/backend";

const config = buildDisplayMediaMasterConfig({
  queryKey: "info-buyback",
  title: "Info Terbaru",
  description: "Informasi Terbaru mengenai Emas, Buyback, Tukar Tambah dan lainnya yang tampil di Display TV.",
  badge: "BUYBACK",
  titleField: "judul_info",
  titleLabel: "Judul Info",
  optionalField: "isi_info",
  optionalLabel: "Isi Info",
  optionalAsTextarea: true,
  allowTextMedia: true,
  defaultMediaType: "text",
  requiredMessage: "Judul info wajib diisi",
  api: infoBuybackApi,
});

export default function InfoBuyback() {
  return <DisplayMediaMasterPage config={config} />;
}
