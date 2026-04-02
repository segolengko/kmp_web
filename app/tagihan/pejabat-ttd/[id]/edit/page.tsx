import { notFound } from "next/navigation";
import { TagihanPejabatTTDForm } from "@/components/tagihan-pejabat-ttd-form";
import { getPejabatTTDById } from "@/lib/tagihan-pejabat-ttd-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPejabatTTDPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getPejabatTTDById(id);

  if (!data) {
    notFound();
  }

  return <TagihanPejabatTTDForm initialData={data} mode="edit" />;
}
