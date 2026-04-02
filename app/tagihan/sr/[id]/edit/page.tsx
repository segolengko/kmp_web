import { notFound } from "next/navigation";
import { TagihanSRForm } from "@/components/tagihan-sr-form";
import { getMitraPerusahaanData } from "@/lib/tagihan-mitra-data";
import { getReferensiSRById } from "@/lib/tagihan-sr-data";
import { getUnitBisnisData } from "@/lib/tagihan-unit-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditReferensiSRPage({ params }: PageProps) {
  const { id } = await params;
  const [data, unitData, mitraData] = await Promise.all([
    getReferensiSRById(id),
    getUnitBisnisData(),
    getMitraPerusahaanData(),
  ]);

  if (!data) {
    notFound();
  }

  return (
    <TagihanSRForm
      initialData={data}
      mitraOptions={mitraData.map((item) => ({ value: String(item.id), label: item.namaPerusahaan }))}
      mode="edit"
      unitOptions={unitData.map((item) => ({ value: String(item.id), label: `${item.kodeUnit} • ${item.namaUnit}` }))}
    />
  );
}
