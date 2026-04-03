export type WorkflowStepSlug =
  | "jo"
  | "jcpr"
  | "invoice"
  | "berita-acara"
  | "faktur-pajak"
  | "jpr"
  | "pencairan";

export type WorkflowDocumentType = "JCPR" | "INVOICE" | "BERITA_ACARA" | "FAKTUR_PAJAK" | "JPR";

export const workflowStepLabels: Record<WorkflowStepSlug, string> = {
  jo: "JO",
  jcpr: "JCPR",
  invoice: "Invoice",
  "berita-acara": "Berita Acara",
  "faktur-pajak": "Faktur Pajak",
  jpr: "JPR",
  pencairan: "Pencairan",
};

export function mapWorkflowStepToDocumentType(step: WorkflowStepSlug): WorkflowDocumentType | null {
  if (step === "jcpr") return "JCPR";
  if (step === "invoice") return "INVOICE";
  if (step === "berita-acara") return "BERITA_ACARA";
  if (step === "faktur-pajak") return "FAKTUR_PAJAK";
  if (step === "jpr") return "JPR";
  return null;
}

export function isWorkflowStepSlug(value: string): value is WorkflowStepSlug {
  return (
    value === "jo" ||
    value === "jcpr" ||
    value === "invoice" ||
    value === "berita-acara" ||
    value === "faktur-pajak" ||
    value === "jpr" ||
    value === "pencairan"
  );
}
