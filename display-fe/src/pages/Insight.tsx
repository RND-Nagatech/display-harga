import DisplayMediaMasterPage, { buildDisplayMediaMasterConfig } from "./DisplayMediaMasterPage";
import { insightApi } from "@/lib/backend";

const config = buildDisplayMediaMasterConfig({
  queryKey: "insight",
  title: "Insight Pasar",
  description: "Tren & Insight Pasar untuk tampil di Display TV.",
  badge: "INSIGHT",
  titleField: "judul_insight",
  titleLabel: "Judul Insight",
  optionalField: "isi_insight",
  optionalLabel: "Isi Insight",
  optionalAsTextarea: true,
  allowTextMedia: true,
  requiredMessage: "Judul insight wajib diisi",
  api: insightApi,
});

export default function Insight() {
  return <DisplayMediaMasterPage config={config} />;
}
