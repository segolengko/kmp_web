import { TagihanPenawaranForm } from "@/components/tagihan-penawaran-form";
import { getReferensiSROptions } from "@/lib/tagihan-sr-data";
import { getPenawaranItemTemplateOptions } from "@/lib/tagihan-penawaran-data";
import { getPejabatTTDOptions } from "@/lib/tagihan-pejabat-ttd-data";

type PageProps = {
  searchParams?: Promise<{
    tagihanId?: string;
  }>;
};

export default async function TambahPenawaranPage({ searchParams }: PageProps) {
  const [srOptions, itemTemplates, pejabatOptions] = await Promise.all([
    getReferensiSROptions(),
    getPenawaranItemTemplateOptions(),
    getPejabatTTDOptions(),
  ]);
  const resolvedSearchParams = (await searchParams) ?? {};
  const tagihanId = resolvedSearchParams.tagihanId?.trim() || null;

  return (
    <TagihanPenawaranForm
      itemTemplates={itemTemplates}
      mode="create"
      pejabatOptions={pejabatOptions}
      srOptions={srOptions}
      tagihanId={tagihanId}
    />
  );
}
