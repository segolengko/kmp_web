import { TagihanPenawaranForm } from "@/components/tagihan-penawaran-form";
import { getReferensiSROptions } from "@/lib/tagihan-sr-data";
import { getPenawaranItemTemplateOptions } from "@/lib/tagihan-penawaran-data";
import { getPejabatTTDOptions } from "@/lib/tagihan-pejabat-ttd-data";

export default async function TambahPenawaranPage() {
  const [srOptions, itemTemplates, pejabatOptions] = await Promise.all([
    getReferensiSROptions(),
    getPenawaranItemTemplateOptions(),
    getPejabatTTDOptions(),
  ]);

  return (
    <TagihanPenawaranForm
      itemTemplates={itemTemplates}
      mode="create"
      pejabatOptions={pejabatOptions}
      srOptions={srOptions}
    />
  );
}
