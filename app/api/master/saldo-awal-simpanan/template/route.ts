import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const rows = [
    {
      "No Anggota": "AG-000001",
      "Kode Simpanan": "SW",
      "Tanggal Saldo Awal": "2026-01-01",
      "Saldo Terbentuk Awal": 200000,
      "Saldo Titipan Awal": 800000,
      "Total Setor Awal": 1000000,
      "Total Tarik Awal": 0,
      "Total Tagihan Awal": 0,
      "Total Tunggakan Awal": 0,
      Catatan: "Contoh saldo awal import.",
    },
  ];

  const petunjuk = [
    { Petunjuk: "Kolom wajib minimal: No Anggota dan Kode Simpanan." },
    { Petunjuk: "Nominal yang kosong akan dianggap 0." },
    { Petunjuk: "Tanggal Saldo Awal boleh kosong, default ke tanggal hari import." },
    { Petunjuk: "Gunakan kode simpanan sesuai master: SP, SW, SS, SPN, dan lainnya." },
    { Petunjuk: "Template ini diimport ke saldo awal, bukan ke tabel ringkasan saldo." },
  ];

  const workbook = XLSX.utils.book_new();
  const dataSheet = XLSX.utils.json_to_sheet(rows);
  const infoSheet = XLSX.utils.json_to_sheet(petunjuk);

  XLSX.utils.book_append_sheet(workbook, dataSheet, "SaldoAwal");
  XLSX.utils.book_append_sheet(workbook, infoSheet, "Petunjuk");

  const fileBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-saldo-awal-simpanan.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
