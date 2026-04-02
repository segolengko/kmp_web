import { notFound } from "next/navigation";
import { AnggotaFormShell } from "@/components/anggota-form-shell";
import { getAnggotaByNoAnggota } from "@/lib/anggota-data";

type EditAnggotaPageProps = {
  params: Promise<{
    noAnggota: string;
  }>;
};

export default async function EditAnggotaPage({ params }: EditAnggotaPageProps) {
  const { noAnggota } = await params;
  const anggota = await getAnggotaByNoAnggota(decodeURIComponent(noAnggota));

  if (!anggota) {
    notFound();
  }

  return <AnggotaFormShell initialData={anggota} mode="edit" />;
}
