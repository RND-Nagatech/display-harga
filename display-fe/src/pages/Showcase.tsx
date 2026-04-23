import DisplayMediaMasterPage, { buildDisplayMediaMasterConfig } from "./DisplayMediaMasterPage";
import { showcaseApi } from "@/lib/backend";

const config = buildDisplayMediaMasterConfig({
  queryKey: "showcases",
  title: "Master Showcase Produk",
  description: "Showcase Produk Unggulan untuk Display TV.",
  badge: "SHOWCASE",
  titleField: "nama_produk",
  titleLabel: "Nama Produk",
  optionalField: "kategori_produk",
  optionalLabel: "Deskripsi Produk",
  allowTextMedia: true,
  requiredMessage: "Nama produk wajib diisi",
  api: showcaseApi,
});

export default function Showcase() {
  return <DisplayMediaMasterPage config={config} />;
}
