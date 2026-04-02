"use client";

type NumericInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  currency?: boolean;
};

function normalizeNumericValue(value: string) {
  const digits = value.replace(/\D+/g, "");

  if (!digits) {
    return "";
  }

  const trimmed = digits.replace(/^0+(?=\d)/, "");
  return trimmed || "0";
}

function formatNumericValue(value: string, currency: boolean) {
  if (!value) {
    return "";
  }

  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Number(value));

  return currency ? `Rp ${formatted}` : formatted;
}

export function NumericInput({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  currency = false,
}: NumericInputProps) {
  return (
    <input
      id={id}
      autoComplete="off"
      disabled={disabled}
      inputMode="numeric"
      onChange={(event) => onChange(normalizeNumericValue(event.target.value))}
      placeholder={placeholder}
      type="text"
      value={formatNumericValue(value, currency)}
    />
  );
}
