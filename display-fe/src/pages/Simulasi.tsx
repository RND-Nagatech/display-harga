import DisplayMediaMasterPage, { buildDisplayMediaMasterConfig } from "./DisplayMediaMasterPage";
import { simulasiApi } from "@/lib/backend";

const config = buildDisplayMediaMasterConfig({
  queryKey: "simulasi",
  title: "Simulasi Harga",
  description: "Simulasi Harga & Perhitungan untuk tampil di Display TV.",
  badge: "SIMULASI",
  titleField: "judul_simulasi",
  titleLabel: "Judul Simulasi",
  optionalField: "deskripsi_simulasi",
  optionalLabel: "Deskripsi Simulasi",
  optionalAsTextarea: true,
  allowTextMedia: true,
  requiredMessage: "Judul simulasi wajib diisi",
  api: simulasiApi,
});

export default function Simulasi() {
  return <DisplayMediaMasterPage config={config} />;
}
