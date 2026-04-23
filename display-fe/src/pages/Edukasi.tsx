import DisplayMediaMasterPage, { buildDisplayMediaMasterConfig } from "./DisplayMediaMasterPage";
import { edukasiApi } from "@/lib/backend";

const config = buildDisplayMediaMasterConfig({
  queryKey: "edukasi",
  title: "Master Edukasi Emas",
  description: "Edukasi Kadar & Jenis Emas untuk Display TV.",
  badge: "EDUKASI",
  titleField: "judul_edukasi",
  titleLabel: "Judul Edukasi",
  optionalField: "isi_edukasi",
  optionalLabel: "Isi Edukasi",
  optionalAsTextarea: true,
  allowTextMedia: true,
  requiredMessage: "Judul edukasi wajib diisi",
  api: edukasiApi,
});

export default function Edukasi() {
  return <DisplayMediaMasterPage config={config} />;
}
