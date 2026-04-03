import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toTerbilangRupiah } from "@/lib/terbilang";

type PenawaranItemPayload = {
  urutan: number;
  nama_item: string;
  deskripsi_item: string | null;
  qty: number;
  satuan: string | null;
  harga_satuan: number;
  jumlah: number;
};

function toNullableString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function toNullableNumber(value: unknown) {
  const normalized = String(value ?? "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

async function validatePejabatIds(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  pejabatIds: Array<number | null>,
) {
  const ids = Array.from(new Set(pejabatIds.filter((value): value is number => value !== null)));

  if (ids.length === 0) {
    return;
  }

  const { data, error } = await supabase.from("pejabat_ttd").select("id").in("id", ids);

  if (error) {
    throw new Error(error.message ?? "Gagal memeriksa pejabat tanda tangan.");
  }

  const foundIds = new Set((data ?? []).map((item) => item.id));
  const invalidIds = ids.filter((id) => !foundIds.has(id));

  if (invalidIds.length > 0) {
    throw new Error("Pejabat TTD yang dipilih tidak ditemukan. Simpan dulu master pejabatnya atau pilih ulang.");
  }
}

function normalizeItems(rawItems: unknown): PenawaranItemPayload[] {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item, index) => {
      const row = (item ?? {}) as Record<string, unknown>;

      return {
        urutan: index + 1,
        nama_item: String(row.namaItem ?? "").trim(),
        deskripsi_item: toNullableString(row.deskripsiItem),
        qty: toNullableNumber(row.qty) ?? 0,
        satuan: toNullableString(row.satuan),
        harga_satuan: toNullableNumber(row.hargaSatuan) ?? 0,
        jumlah: (toNullableNumber(row.qty) ?? 0) * (toNullableNumber(row.hargaSatuan) ?? 0),
      };
    })
    .filter((item) => item.nama_item.length > 0);
}

function toRomanMonth(month: number) {
  const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return romans[month - 1] ?? String(month);
}

async function generateNoPenawaran(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  referensiSrId: number,
  tanggalPenawaran: string,
) {
  const { data: srRow, error: srError } = await supabase
    .from("referensi_sr")
    .select("id,unit_bisnis_id,unit_bisnis:unit_bisnis_id(kode_unit)")
    .eq("id", referensiSrId)
    .single();

  if (srError || !srRow) {
    throw new Error("Referensi SR tidak ditemukan untuk membuat nomor penawaran.");
  }

  const unitBisnis = Array.isArray(srRow.unit_bisnis) ? srRow.unit_bisnis[0] : srRow.unit_bisnis;
  const kodeUnit = String(unitBisnis?.kode_unit ?? "").trim().toUpperCase();

  if (!kodeUnit) {
    throw new Error("Kode unit bisnis belum tersedia untuk membuat nomor penawaran.");
  }

  const date = new Date(`${tanggalPenawaran}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Tanggal penawaran tidak valid.");
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndDate = new Date(year, month, 0);
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(monthEndDate.getDate()).padStart(2, "0")}`;

  const { data: srRowsInUnit, error: srRowsError } = await supabase
    .from("referensi_sr")
    .select("id")
    .eq("unit_bisnis_id", srRow.unit_bisnis_id);

  if (srRowsError) {
    throw new Error(srRowsError.message ?? "Gagal membaca SR unit bisnis.");
  }

  const referensiSrIds = (srRowsInUnit ?? []).map((item) => item.id).filter(Boolean);
  if (referensiSrIds.length === 0) {
    return `001/KMP/${kodeUnit}/PEN/${toRomanMonth(month)}/${year}`;
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("penawaran_project")
    .select("no_penawaran")
    .in("referensi_sr_id", referensiSrIds)
    .gte("tanggal_penawaran", monthStart)
    .lte("tanggal_penawaran", monthEnd);

  if (existingError) {
    throw new Error(existingError.message ?? "Gagal membaca nomor penawaran yang sudah ada.");
  }

  const prefix = `/KMP/${kodeUnit}/PEN/${toRomanMonth(month)}/${year}`;
  const lastSequence = (existingRows ?? []).reduce((maxValue, row) => {
    const nomor = String(row.no_penawaran ?? "").trim();
    if (!nomor.endsWith(prefix)) {
      return maxValue;
    }

    const [firstPart] = nomor.split("/");
    const parsed = Number(firstPart);
    return Number.isFinite(parsed) ? Math.max(maxValue, parsed) : maxValue;
  }, 0);

  const nextSequence = String(lastSequence + 1).padStart(3, "0");
  return `${nextSequence}${prefix}`;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase belum terkonfigurasi." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "Payload penawaran tidak valid." }, { status: 400 });
  }

  const items = normalizeItems(body.items);

  if (items.length === 0) {
    return NextResponse.json({ error: "Minimal harus ada satu item penawaran." }, { status: 400 });
  }

  const referensiSrId = toNullableNumber(body.referensiSrId);
  const tanggalPenawaran = String(body.tanggalPenawaran ?? "").trim();
  const requestedNoPenawaran = String(body.noPenawaran ?? "").trim();
  const tagihanId = toNullableNumber(body.tagihanId);
  const subtotal = items.reduce((total, item) => total + item.jumlah, 0);
  const nilaiPpn = Math.round(subtotal * 0.11);
  const nilaiTotal = subtotal + nilaiPpn;
  const terbilang = toTerbilangRupiah(nilaiTotal);
  const pejabatTtdId = toNullableNumber(body.pejabatTtdId);
  const pejabatTtd2Id = toNullableNumber(body.pejabatTtd2Id);
  const pejabatTtd3Id = toNullableNumber(body.pejabatTtd3Id);

  const payload = {
    referensi_sr_id: referensiSrId,
    no_penawaran: requestedNoPenawaran,
    tanggal_penawaran: tanggalPenawaran,
    perihal: String(body.perihal ?? "").trim(),
    pembuka_surat: toNullableString(body.pembukaSurat),
    subtotal,
    nilai_ppn: nilaiPpn,
    nilai_total: nilaiTotal,
    terbilang,
    tempat_ttd: toNullableString(body.tempatTtd),
    tanggal_ttd: toNullableString(body.tanggalTtd),
    pejabat_ttd_id: pejabatTtdId,
    penandatangan_nama: toNullableString(body.penandatanganNama),
    penandatangan_jabatan: toNullableString(body.penandatanganJabatan),
    pejabat_ttd_2_id: pejabatTtd2Id,
    penandatangan_nama_2: toNullableString(body.penandatanganNama2),
    penandatangan_jabatan_2: toNullableString(body.penandatanganJabatan2),
    pejabat_ttd_3_id: pejabatTtd3Id,
    penandatangan_nama_3: toNullableString(body.penandatanganNama3),
    penandatangan_jabatan_3: toNullableString(body.penandatanganJabatan3),
    status_penawaran: String(body.statusPenawaran ?? "DRAFT").trim() || "DRAFT",
    catatan: toNullableString(body.catatan),
    updated_at: new Date().toISOString(),
  };

  if (!payload.referensi_sr_id || !payload.no_penawaran || !payload.tanggal_penawaran || !payload.perihal) {
    if (!payload.referensi_sr_id || !payload.tanggal_penawaran || !payload.perihal) {
      return NextResponse.json({ error: "Field wajib penawaran belum lengkap." }, { status: 400 });
    }
  }

  try {
    await validatePejabatIds(supabase, [pejabatTtdId, pejabatTtd2Id, pejabatTtd3Id]);
    payload.no_penawaran =
      payload.no_penawaran || (await generateNoPenawaran(supabase, referensiSrId!, tanggalPenawaran));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal membuat nomor penawaran." },
      { status: 400 },
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("penawaran_project")
    .insert(payload)
    .select("id")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json({ error: insertError?.message ?? "Gagal menambah penawaran." }, { status: 400 });
  }

  const itemPayload = items.map((item) => ({
    penawaran_project_id: inserted.id,
    ...item,
    updated_at: new Date().toISOString(),
  }));

  const { error: itemError } = await supabase.from("penawaran_project_item").insert(itemPayload);

  if (itemError) {
    await supabase.from("penawaran_project").delete().eq("id", inserted.id);
    return NextResponse.json({ error: itemError.message ?? "Gagal menyimpan item penawaran." }, { status: 400 });
  }

  if (tagihanId) {
    const { data: updatedTagihan, error: tagihanError } = await supabase
      .from("tagihan_project")
      .update({
        no_penawaran: payload.no_penawaran,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tagihanId)
      .select("id")
      .maybeSingle();

    if (tagihanError || !updatedTagihan) {
      await supabase.from("penawaran_project_item").delete().eq("penawaran_project_id", inserted.id);
      await supabase.from("penawaran_project").delete().eq("id", inserted.id);
      return NextResponse.json(
        { error: tagihanError?.message ?? "Data tagihan tujuan tidak ditemukan untuk mengaitkan nomor penawaran." },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ data: inserted }, { status: 201 });
}
