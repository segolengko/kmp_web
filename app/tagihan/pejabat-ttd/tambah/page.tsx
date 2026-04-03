import { TagihanPejabatTTDForm } from "@/components/tagihan-pejabat-ttd-form";
import { getMitraPerusahaanOptions } from "@/lib/tagihan-mitra-data";
import { getUnitBisnisOptions } from "@/lib/tagihan-unit-data";

export default async function TambahPejabatTTDPage() {
  const [unitOptions, mitraOptions] = await Promise.all([
    getUnitBisnisOptions(),
    getMitraPerusahaanOptions(),
  ]);

  return <TagihanPejabatTTDForm mitraOptions={mitraOptions} mode="create" unitOptions={unitOptions} />;
}
