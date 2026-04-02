import { TagihanSRForm } from "@/components/tagihan-sr-form";
import { getMitraPerusahaanData } from "@/lib/tagihan-mitra-data";
import { getUnitBisnisData } from "@/lib/tagihan-unit-data";

export default async function TambahReferensiSRPage() {
  const [unitData, mitraData] = await Promise.all([getUnitBisnisData(), getMitraPerusahaanData()]);

  return (
    <TagihanSRForm
      mitraOptions={mitraData.map((item) => ({ value: String(item.id), label: item.namaPerusahaan }))}
      mode="create"
      unitOptions={unitData.map((item) => ({ value: String(item.id), label: `${item.kodeUnit} • ${item.namaUnit}` }))}
    />
  );
}
