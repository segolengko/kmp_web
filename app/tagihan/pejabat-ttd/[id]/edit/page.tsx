import { notFound } from "next/navigation";
import { TagihanPejabatTTDForm } from "@/components/tagihan-pejabat-ttd-form";
import { getMitraPerusahaanOptions } from "@/lib/tagihan-mitra-data";
import { getPejabatTTDById } from "@/lib/tagihan-pejabat-ttd-data";
import { getUnitBisnisOptions } from "@/lib/tagihan-unit-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPejabatTTDPage({ params }: PageProps) {
  const { id } = await params;
  const [data, unitOptions, mitraOptions] = await Promise.all([
    getPejabatTTDById(id),
    getUnitBisnisOptions(),
    getMitraPerusahaanOptions(),
  ]);

  if (!data) {
    notFound();
  }

  return <TagihanPejabatTTDForm initialData={data} mitraOptions={mitraOptions} mode="edit" unitOptions={unitOptions} />;
}
