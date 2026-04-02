import { notFound } from "next/navigation";
import { TagihanPenawaranForm } from "@/components/tagihan-penawaran-form";
import { getPenawaranItemTemplateOptions, getPenawaranProjectById } from "@/lib/tagihan-penawaran-data";
import { getPejabatTTDOptions } from "@/lib/tagihan-pejabat-ttd-data";
import { getReferensiSROptions } from "@/lib/tagihan-sr-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPenawaranPage({ params }: PageProps) {
  const { id } = await params;
  const [data, srOptions, itemTemplates, pejabatOptions] = await Promise.all([
    getPenawaranProjectById(id),
    getReferensiSROptions(),
    getPenawaranItemTemplateOptions(),
    getPejabatTTDOptions(),
  ]);

  if (!data) {
    notFound();
  }

  return (
    <TagihanPenawaranForm
      initialData={data}
      itemTemplates={itemTemplates}
      mode="edit"
      pejabatOptions={pejabatOptions}
      srOptions={srOptions}
    />
  );
}
