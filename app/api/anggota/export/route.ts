import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getAnggotaData } from "@/lib/anggota-data";

function toLabelJenis(jenis: "BIASA" | "LUAR_BIASA") {
  return jenis === "BIASA" ? "BIASA" : "LUAR_BIASA";
}

function toLabelKelamin(jenisKelamin?: "LAKI_LAKI" | "PEREMPUAN") {
  return jenisKelamin ?? "LAKI_LAKI";
}

export async function GET() {
  const anggotaResult = await getAnggotaData();

  const rows = anggotaResult.data.map((item) => ({
    "No Anggota": item.noAnggota,
    "Nama Lengkap": item.namaLengkap,
    "Jenis Kelamin": toLabelKelamin(item.jenisKelamin),
    "Jenis Anggota": toLabelJenis(item.jenisAnggota),
    "Status Anggota": item.statusAnggota,
    "No KTP": item.nik ?? "",
    Departemen: item.departemen === "-" ? "" : item.departemen,
    Jabatan: item.jabatan === "-" ? "" : item.jabatan,
    "Tanggal Masuk Kerja": item.tanggalMasukKerja ?? "",
    "Tanggal Masuk Koperasi":
      item.tanggalMasukKoperasi === "-" ? "" : item.tanggalMasukKoperasi,
    "No HP": item.noHp === "-" ? "" : item.noHp,
    Email: item.email ?? "",
    "Foto URL": item.fotoUrl ?? "",
    Alamat: item.alamat ?? "",
    Catatan: item.catatan ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Anggota");

  const fileBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="anggota-kmp-export.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
