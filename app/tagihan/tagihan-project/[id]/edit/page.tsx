import { notFound } from "next/navigation";
import { TagihanProjectForm } from "@/components/tagihan-project-form";
import { getTagihanProjectById, getUnitBisnisTagihanOptions } from "@/lib/tagihan-project-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTagihanProjectPage({ params }: PageProps) {
  const { id } = await params;
  const [data, unitOptions] = await Promise.all([
    getTagihanProjectById(id),
    getUnitBisnisTagihanOptions(),
  ]);

  if (!data) {
    notFound();
  }

  return <TagihanProjectForm initialData={data} mode="edit" unitOptions={unitOptions} />;
}
