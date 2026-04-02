function normalizeInteger(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(Math.abs(value)));
}

function toWords(value: number): string {
  const angka = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

  if (value < 12) {
    return angka[value] ?? "";
  }

  if (value < 20) {
    return `${toWords(value - 10)} belas`;
  }

  if (value < 100) {
    const puluhan = Math.floor(value / 10);
    const sisa = value % 10;
    return `${toWords(puluhan)} puluh${sisa > 0 ? ` ${toWords(sisa)}` : ""}`;
  }

  if (value < 200) {
    return `seratus${value > 100 ? ` ${toWords(value - 100)}` : ""}`;
  }

  if (value < 1000) {
    const ratusan = Math.floor(value / 100);
    const sisa = value % 100;
    return `${toWords(ratusan)} ratus${sisa > 0 ? ` ${toWords(sisa)}` : ""}`;
  }

  if (value < 2000) {
    return `seribu${value > 1000 ? ` ${toWords(value - 1000)}` : ""}`;
  }

  if (value < 1000000) {
    const ribuan = Math.floor(value / 1000);
    const sisa = value % 1000;
    return `${toWords(ribuan)} ribu${sisa > 0 ? ` ${toWords(sisa)}` : ""}`;
  }

  if (value < 1000000000) {
    const jutaan = Math.floor(value / 1000000);
    const sisa = value % 1000000;
    return `${toWords(jutaan)} juta${sisa > 0 ? ` ${toWords(sisa)}` : ""}`;
  }

  if (value < 1000000000000) {
    const miliaran = Math.floor(value / 1000000000);
    const sisa = value % 1000000000;
    return `${toWords(miliaran)} miliar${sisa > 0 ? ` ${toWords(sisa)}` : ""}`;
  }

  const triliunan = Math.floor(value / 1000000000000);
  const sisa = value % 1000000000000;
  return `${toWords(triliunan)} triliun${sisa > 0 ? ` ${toWords(sisa)}` : ""}`;
}

export function toTerbilang(value: number) {
  const normalized = normalizeInteger(value);

  if (normalized === 0) {
    return "nol";
  }

  return toWords(normalized).replace(/\s+/g, " ").trim();
}

export function toTerbilangRupiah(value: number) {
  return `${toTerbilang(value)} rupiah`;
}
