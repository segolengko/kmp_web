import { TagihanProjectForm } from "@/components/tagihan-project-form";
import { getUnitBisnisTagihanOptions } from "@/lib/tagihan-project-data";

export default async function TambahTagihanProjectPage() {
  const unitOptions = await getUnitBisnisTagihanOptions();

  return <TagihanProjectForm mode="create" unitOptions={unitOptions} />;
}
