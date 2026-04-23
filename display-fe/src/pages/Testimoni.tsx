import DisplayMediaMasterPage, { buildDisplayMediaMasterConfig } from "./DisplayMediaMasterPage";
import { testimoniApi } from "@/lib/backend";

const config = buildDisplayMediaMasterConfig({
  queryKey: "testimoni",
  title: "Master Testimoni",
  description: "Testimoni Pelanggan untuk tampil di Display TV.",
  badge: "TESTIMONI",
  titleField: "nama_pelanggan",
  titleLabel: "Nama Pelanggan",
  optionalField: "isi_testimoni",
  optionalLabel: "Isi Testimoni",
  optionalAsTextarea: true,
  allowTextMedia: true,
  requiredMessage: "Nama pelanggan wajib diisi",
  api: testimoniApi,
});

export default function Testimoni() {
  return <DisplayMediaMasterPage config={config} />;
}
