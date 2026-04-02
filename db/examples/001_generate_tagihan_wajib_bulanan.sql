WITH params AS (
    SELECT
        DATE '2026-04-01' AS tanggal_proses,
        2026::SMALLINT AS periode_tahun,
        4::SMALLINT AS periode_bulan,
        'system'::VARCHAR(100) AS dibuat_oleh
),
jenis_target AS (
    SELECT id, kode
    FROM jenis_simpanan
    WHERE kode = 'SW'
),
pengaturan_aktif AS (
    SELECT
        ps.jenis_simpanan_id,
        ps.nominal
    FROM pengaturan_simpanan ps
    JOIN jenis_target jt ON jt.id = ps.jenis_simpanan_id
    JOIN params p
      ON p.tanggal_proses BETWEEN ps.berlaku_mulai AND COALESCE(ps.berlaku_sampai, DATE '2999-12-31')
    WHERE ps.aktif = TRUE
    ORDER BY ps.berlaku_mulai DESC
    LIMIT 1
),
batch_upsert AS (
    INSERT INTO batch_generate_tagihan_simpanan (
        kode_batch,
        jenis_simpanan_id,
        periode_tahun,
        periode_bulan,
        tanggal_proses,
        total_anggota,
        total_tagihan_terbentuk,
        status_batch,
        catatan,
        dibuat_oleh
    )
    SELECT
        FORMAT('BATCH-%s-%s', jt.kode, TO_CHAR(p.tanggal_proses, 'YYYYMM')),
        jt.id,
        p.periode_tahun,
        p.periode_bulan,
        CURRENT_TIMESTAMP,
        0,
        0,
        'PROSES',
        'Generate simpanan wajib bulanan.',
        p.dibuat_oleh
    FROM params p
    CROSS JOIN jenis_target jt
    ON CONFLICT (jenis_simpanan_id, periode_tahun, periode_bulan)
    DO UPDATE SET
        status_batch = 'PROSES',
        updated_at = CURRENT_TIMESTAMP
    RETURNING id, jenis_simpanan_id
),
tagihan_baru AS (
    INSERT INTO tagihan_simpanan (
        no_tagihan,
        anggota_id,
        jenis_simpanan_id,
        periode_label,
        periode_tahun,
        periode_bulan,
        tanggal_tagihan,
        tanggal_jatuh_tempo,
        nominal_tagihan,
        nominal_terbayar,
        status_tagihan,
        keterangan,
        batch_generate_tagihan_simpanan_id
    )
    SELECT
        FORMAT('TG-%s-%s-%s', jt.kode, TO_CHAR(p.tanggal_proses, 'YYYYMM'), LPAD(a.id::TEXT, 6, '0')),
        a.id,
        jt.id,
        TO_CHAR(p.tanggal_proses, 'YYYY-MM'),
        p.periode_tahun,
        p.periode_bulan,
        p.tanggal_proses,
        (DATE_TRUNC('month', p.tanggal_proses)::DATE + INTERVAL '1 month - 1 day')::DATE,
        pa.nominal,
        0,
        'BELUM_BAYAR',
        'Tagihan simpanan wajib bulanan.',
        bu.id
    FROM params p
    CROSS JOIN jenis_target jt
    CROSS JOIN pengaturan_aktif pa
    JOIN batch_upsert bu ON bu.jenis_simpanan_id = jt.id
    JOIN anggota a
      ON a.status_anggota <> 'KELUAR'
     AND (a.tanggal_keluar_koperasi IS NULL OR a.tanggal_keluar_koperasi >= p.tanggal_proses)
    WHERE NOT EXISTS (
        SELECT 1
        FROM tagihan_simpanan ts
        WHERE ts.anggota_id = a.id
          AND ts.jenis_simpanan_id = jt.id
          AND ts.periode_tahun = p.periode_tahun
          AND ts.periode_bulan = p.periode_bulan
    )
    RETURNING anggota_id
)
UPDATE batch_generate_tagihan_simpanan bg
SET
    total_anggota = (
        SELECT COUNT(*)
        FROM anggota a
        CROSS JOIN params p
        WHERE a.status_anggota <> 'KELUAR'
          AND (a.tanggal_keluar_koperasi IS NULL OR a.tanggal_keluar_koperasi >= p.tanggal_proses)
    ),
    total_tagihan_terbentuk = (SELECT COUNT(*) FROM tagihan_baru),
    status_batch = 'SELESAI',
    updated_at = CURRENT_TIMESTAMP
WHERE bg.id = (SELECT id FROM batch_upsert);
