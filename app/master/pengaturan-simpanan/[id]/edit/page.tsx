import { notFound } from "next/navigation";
import { PengaturanSimpananForm } from "@/components/pengaturan-simpanan-form";
import { getJenisSimpananData } from "@/lib/jenis-simpanan-data";
import { getPengaturanSimpananById } from "@/lib/pengaturan-simpanan-data";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPengaturanSimpananPage({ params }: PageProps) {
  const { id } = await params;
  const [initialData, jenisSimpananOptions] = await Promise.all([
    getPengaturanSimpananById(id),
    getJenisSimpananData(),
  ]);

  if (!initialData) {
    notFound();
  }

  return (
    <PengaturanSimpananForm
      initialData={initialData}
      jenisSimpananOptions={jenisSimpananOptions}
      mode="edit"
    />
  );
}
