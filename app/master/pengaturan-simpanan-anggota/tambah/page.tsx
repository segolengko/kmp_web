import { PengaturanSimpananAnggotaForm } from "@/components/pengaturan-simpanan-anggota-form";
import { getPengaturanAnggotaOptions } from "@/lib/pengaturan-simpanan-anggota-data";

export default async function TambahPengaturanSimpananAnggotaPage() {
  const { anggotaOptions, jenisSimpananOptions } = await getPengaturanAnggotaOptions();

  return (
    <PengaturanSimpananAnggotaForm
      anggotaOptions={anggotaOptions}
      jenisSimpananOptions={jenisSimpananOptions}
      mode="create"
    />
  );
}
