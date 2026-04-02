import { notFound } from "next/navigation";
import { TagihanMitraForm } from "@/components/tagihan-mitra-form";
import { getMitraPerusahaanById } from "@/lib/tagihan-mitra-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditMitraPerusahaanPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getMitraPerusahaanById(id);

  if (!data) {
    notFound();
  }

  return <TagihanMitraForm initialData={data} mode="edit" />;
}
