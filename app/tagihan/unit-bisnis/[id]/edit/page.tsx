import { notFound } from "next/navigation";
import { TagihanUnitForm } from "@/components/tagihan-unit-form";
import { getUnitBisnisById } from "@/lib/tagihan-unit-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUnitBisnisPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getUnitBisnisById(id);

  if (!data) {
    notFound();
  }

  return <TagihanUnitForm initialData={data} mode="edit" />;
}
