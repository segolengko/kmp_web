import { PengaturanSimpananForm } from "@/components/pengaturan-simpanan-form";
import { getJenisSimpananData } from "@/lib/jenis-simpanan-data";

export default async function TambahPengaturanSimpananPage() {
  const jenisSimpananOptions = await getJenisSimpananData();

  return <PengaturanSimpananForm jenisSimpananOptions={jenisSimpananOptions} mode="create" />;
}
