WITH params AS (
    SELECT
        'AG0003'::VARCHAR(30) AS no_anggota_target,
        DATE '2026-03-01' AS tanggal_tagihan
),
anggota_target AS (
    SELECT id, no_anggota
    FROM anggota
    WHERE no_anggota = (SELECT no_anggota_target FROM params)
),
tagihan_master AS (
    SELECT
        js.id AS jenis_simpanan_id,
        js.kode,
        js.nama,
        js.boleh_cicil,
        ps.nominal
    FROM jenis_simpanan js
    JOIN pengaturan_simpanan ps ON ps.jenis_simpanan_id = js.id
    JOIN params p
      ON p.tanggal_tagihan BETWEEN ps.berlaku_mulai AND COALESCE(ps.berlaku_sampai, DATE '2999-12-31')
    WHERE js.kode IN ('SP', 'SPN')
      AND ps.aktif = TRUE
),
tagihan_insert AS (
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
        keterangan
    )
    SELECT
        FORMAT('TG-%s-%s-%s', tm.kode, TO_CHAR(p.tanggal_tagihan, 'YYYYMMDD'), LPAD(at.id::TEXT, 6, '0')),
        at.id,
        tm.jenis_simpanan_id,
        CASE
            WHEN tm.kode = 'SP' THEN 'POKOK-AWAL'
            WHEN tm.kode = 'SPN' THEN 'PENYERTAAN-AWAL'
        END,
        EXTRACT(YEAR FROM p.tanggal_tagihan)::SMALLINT,
        EXTRACT(MONTH FROM p.tanggal_tagihan)::SMALLINT,
        p.tanggal_tagihan,
        p.tanggal_tagihan,
        tm.nominal,
        0,
        'BELUM_BAYAR',
        CASE
            WHEN tm.kode = 'SP' THEN 'Tagihan awal simpanan pokok.'
            WHEN tm.kode = 'SPN' THEN 'Tagihan awal simpanan penyertaan.'
        END
    FROM params p
    CROSS JOIN anggota_target at
    CROSS JOIN tagihan_master tm
    WHERE NOT EXISTS (
        SELECT 1
        FROM tagihan_simpanan ts
        WHERE ts.anggota_id = at.id
          AND ts.jenis_simpanan_id = tm.jenis_simpanan_id
          AND ts.periode_label = CASE
              WHEN tm.kode = 'SP' THEN 'POKOK-AWAL'
              WHEN tm.kode = 'SPN' THEN 'PENYERTAAN-AWAL'
          END
    )
    RETURNING id
)
SELECT COUNT(*) AS total_tagihan_awal_terbentuk
FROM tagihan_insert;
