import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ExcelRow = Record<string, unknown>;

type AnggotaLookupRow = {
  id: number;
  no_anggota: string;
};

type JenisSimpananLookupRow = {
  id: number;
  kode: string;
};

type SaldoAwalPayload = {
  anggota_id: number;
  jenis_simpanan_id: number;
  tanggal_saldo_awal: string;
  saldo_terbentuk_awal: number;
  saldo_titipan_awal: number;
  total_setor_awal: number;
  total_tarik_awal: number;
  total_tagihan_awal: number;
  total_tunggakan_awal: number;
  catatan: string | null;
  created_by: string | null;
  updated_at: string;
};

function pickValue(row: ExcelRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value !== undefined && value !== null && String(value).trim().length > 0) {
      return String(value).trim();
    }
  }

  return "";
}

function normalizeDate(value: string) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const normalized = value.replace(/\//g, "-");
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Tanggal saldo awal "${value}" tidak valid.`);
  }

  return parsed.toISOString().slice(0, 10);
}

function parseNumber(value: string, fallback = 0) {
  if (!value) {
    return fallback;
  }

  const normalized = value.replace(/,/g, "");
  const parsed = Number(normalized);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`Nominal "${value}" tidak valid.`);
  }

  return parsed;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase belum terkonfigurasi di environment aplikasi." },
      { status: 500 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File Excel belum dipilih." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return NextResponse.json({ error: "Sheet Excel tidak ditemukan." }, { status: 400 });
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
    defval: "",
    raw: false,
  });

  if (rows.length === 0) {
    return NextResponse.json({ error: "File Excel tidak memiliki data." }, { status: 400 });
  }

  const [{ data: anggotaRows, error: anggotaError }, { data: jenisRows, error: jenisError }] =
    await Promise.all([
      supabase.from("anggota").select("id,no_anggota"),
      supabase.from("jenis_simpanan").select("id,kode"),
    ]);

  if (anggotaError || !anggotaRows) {
    return NextResponse.json(
      { error: anggotaError?.message ?? "Data anggota gagal dimuat." },
      { status: 400 },
    );
  }

  if (jenisError || !jenisRows) {
    return NextResponse.json(
      { error: jenisError?.message ?? "Data jenis simpanan gagal dimuat." },
      { status: 400 },
    );
  }

  const anggotaMap = new Map(
    (anggotaRows as AnggotaLookupRow[]).map((row) => [row.no_anggota.toUpperCase(), row.id]),
  );
  const jenisMap = new Map(
    (jenisRows as JenisSimpananLookupRow[]).map((row) => [row.kode.toUpperCase(), row.id]),
  );

  let payloads: SaldoAwalPayload[];

  try {
    payloads = rows.map((row, index) => {
      const noAnggota = pickValue(row, ["No Anggota", "No. Anggota", "no_anggota"]).toUpperCase();
      const kodeSimpanan = pickValue(row, ["Kode Simpanan", "kode_simpanan"]).toUpperCase();

      if (!noAnggota || !kodeSimpanan) {
        throw new Error(`Baris ${index + 2} wajib memiliki No Anggota dan Kode Simpanan.`);
      }

      const anggotaId = anggotaMap.get(noAnggota);
      const jenisSimpananId = jenisMap.get(kodeSimpanan);

      if (!anggotaId) {
        throw new Error(`Baris ${index + 2}: anggota ${noAnggota} tidak ditemukan.`);
      }

      if (!jenisSimpananId) {
        throw new Error(`Baris ${index + 2}: simpanan ${kodeSimpanan} tidak ditemukan.`);
      }

      return {
        anggota_id: anggotaId,
        jenis_simpanan_id: jenisSimpananId,
        tanggal_saldo_awal: normalizeDate(
          pickValue(row, ["Tanggal Saldo Awal", "tanggal_saldo_awal"]),
        ),
        saldo_terbentuk_awal: parseNumber(
          pickValue(row, ["Saldo Terbentuk Awal", "saldo_terbentuk_awal"]),
        ),
        saldo_titipan_awal: parseNumber(
          pickValue(row, ["Saldo Titipan Awal", "saldo_titipan_awal"]),
        ),
        total_setor_awal: parseNumber(
          pickValue(row, ["Total Setor Awal", "total_setor_awal"]),
        ),
        total_tarik_awal: parseNumber(
          pickValue(row, ["Total Tarik Awal", "total_tarik_awal"]),
        ),
        total_tagihan_awal: parseNumber(
          pickValue(row, ["Total Tagihan Awal", "total_tagihan_awal"]),
        ),
        total_tunggakan_awal: parseNumber(
          pickValue(row, ["Total Tunggakan Awal", "total_tunggakan_awal"]),
        ),
        catatan: pickValue(row, ["Catatan", "catatan"]) || null,
        created_by: user?.email ?? "system",
        updated_at: new Date().toISOString(),
      };
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Format file Excel tidak valid." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("saldo_awal_simpanan_anggota")
    .upsert(payloads, { onConflict: "anggota_id,jenis_simpanan_id" });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Import saldo awal gagal diproses." },
      { status: 400 },
    );
  }

  const uniquePairs = Array.from(
    new Map(
      payloads.map((item) => [
        `${item.anggota_id}-${item.jenis_simpanan_id}`,
        {
          anggota_id: item.anggota_id,
          jenis_simpanan_id: item.jenis_simpanan_id,
        },
      ]),
    ).values(),
  );

  await Promise.all(
    uniquePairs.flatMap((pair) => [
      supabase.rpc("fn_refresh_saldo_simpanan_anggota", {
        p_anggota_id: pair.anggota_id,
        p_jenis_simpanan_id: pair.jenis_simpanan_id,
      }),
      supabase.rpc("fn_refresh_titipan_simpanan_anggota", {
        p_anggota_id: pair.anggota_id,
        p_jenis_simpanan_id: pair.jenis_simpanan_id,
      }),
    ]),
  );

  return NextResponse.json({
    imported: payloads.length,
    message: `${payloads.length} baris saldo awal simpanan berhasil diimport.`,
  });
}
