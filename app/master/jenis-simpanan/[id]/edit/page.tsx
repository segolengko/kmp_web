import { notFound } from "next/navigation";
import { JenisSimpananForm } from "@/components/jenis-simpanan-form";
import { getJenisSimpananById } from "@/lib/jenis-simpanan-data";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditJenisSimpananPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getJenisSimpananById(id);

  if (!data) {
    notFound();
  }

  return <JenisSimpananForm initialData={data} mode="edit" />;
}
