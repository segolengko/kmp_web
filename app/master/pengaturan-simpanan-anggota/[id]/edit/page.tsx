import { notFound } from "next/navigation";
import { PengaturanSimpananAnggotaForm } from "@/components/pengaturan-simpanan-anggota-form";
import {
  getPengaturanAnggotaOptions,
  getPengaturanSimpananAnggotaById,
} from "@/lib/pengaturan-simpanan-anggota-data";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditPengaturanSimpananAnggotaPage({ params }: PageProps) {
  const { id } = await params;
  const [initialData, options] = await Promise.all([
    getPengaturanSimpananAnggotaById(id),
    getPengaturanAnggotaOptions(),
  ]);

  if (!initialData) {
    notFound();
  }

  return (
    <PengaturanSimpananAnggotaForm
      anggotaOptions={options.anggotaOptions}
      initialData={initialData}
      jenisSimpananOptions={options.jenisSimpananOptions}
      mode="edit"
    />
  );
}
