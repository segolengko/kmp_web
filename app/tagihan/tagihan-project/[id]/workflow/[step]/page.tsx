import { notFound } from "next/navigation";
import { TagihanWorkflowStepForm } from "@/components/tagihan-workflow-step-form";
import { getTagihanWorkflowContext } from "@/lib/tagihan-workflow-data";
import { isWorkflowStepSlug } from "@/lib/tagihan-workflow-shared";

type PageProps = {
  params: Promise<{ id: string; step: string }>;
};

export default async function TagihanWorkflowStepPage({ params }: PageProps) {
  const { id, step } = await params;

  if (!isWorkflowStepSlug(step)) {
    notFound();
  }

  const data = await getTagihanWorkflowContext(id);

  if (!data) {
    notFound();
  }

  return <TagihanWorkflowStepForm data={data} step={step} />;
}
