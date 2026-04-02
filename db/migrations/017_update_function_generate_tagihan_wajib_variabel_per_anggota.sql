CREATE OR REPLACE FUNCTION fn_generate_tagihan_wajib_bulanan(
    p_tanggal_proses DATE DEFAULT CURRENT_DATE,
    p_dibuat_oleh VARCHAR(100) DEFAULT 'system'
)
RETURNS TABLE (
    batch_id BIGINT,
    periode_tahun SMALLINT,
    periode_bulan SMALLINT,
    total_anggota INTEGER,
    total_tagihan_terbentuk INTEGER,
    status_batch VARCHAR(20)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_jenis_simpanan_id BIGINT;
    v_kode_simpanan VARCHAR(30);
    v_nominal_default NUMERIC(18, 2);
    v_periode_tahun SMALLINT;
    v_periode_bulan SMALLINT;
    v_batch_id BIGINT;
    v_total_anggota INTEGER;
    v_total_tagihan_terbentuk INTEGER;
    v_total_anggota_tanpa_nominal INTEGER;
BEGIN
    SELECT js.id, js.kode
    INTO v_jenis_simpanan_id, v_kode_simpanan
    FROM jenis_simpanan js
    WHERE js.kode = 'SW'
      AND js.aktif = TRUE;

    IF v_jenis_simpanan_id IS NULL THEN
        RAISE EXCEPTION 'Jenis simpanan wajib (SW) tidak ditemukan atau tidak aktif.';
    END IF;

    SELECT ps.nominal
    INTO v_nominal_default
    FROM pengaturan_simpanan ps
    WHERE ps.jenis_simpanan_id = v_jenis_simpanan_id
      AND ps.aktif = TRUE
      AND p_tanggal_proses BETWEEN ps.berlaku_mulai AND COALESCE(ps.berlaku_sampai, DATE '2999-12-31')
    ORDER BY ps.berlaku_mulai DESC
    LIMIT 1;

    v_periode_tahun := EXTRACT(YEAR FROM p_tanggal_proses)::SMALLINT;
    v_periode_bulan := EXTRACT(MONTH FROM p_tanggal_proses)::SMALLINT;

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
    VALUES (
        FORMAT('BATCH-%s-%s', v_kode_simpanan, TO_CHAR(p_tanggal_proses, 'YYYYMM')),
        v_jenis_simpanan_id,
        v_periode_tahun,
        v_periode_bulan,
        CURRENT_TIMESTAMP,
        0,
        0,
        'PROSES',
        'Generate simpanan wajib bulanan dengan dukungan nominal variabel per anggota.',
        p_dibuat_oleh
    )
    ON CONFLICT ON CONSTRAINT uq_batch_generate_tagihan_periode
    DO UPDATE SET
        status_batch = 'PROSES',
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_batch_id;

    SELECT COUNT(*)
    INTO v_total_anggota
    FROM anggota a
    WHERE a.status_anggota <> 'KELUAR'
      AND (a.tanggal_keluar_koperasi IS NULL OR a.tanggal_keluar_koperasi >= p_tanggal_proses);

    WITH kandidat AS (
        SELECT
            a.id AS anggota_id,
            COALESCE(psa.nominal, v_nominal_default) AS nominal_tagihan,
            CASE
                WHEN psa.id IS NOT NULL THEN 'PENGATURAN_ANGGOTA'
                WHEN v_nominal_default IS NOT NULL THEN 'PENGATURAN_UMUM'
                ELSE 'TIDAK_ADA_PENGATURAN'
            END AS sumber_nominal
        FROM anggota a
        LEFT JOIN LATERAL (
            SELECT
                psa.id,
                psa.nominal
            FROM pengaturan_simpanan_anggota psa
            WHERE psa.anggota_id = a.id
              AND psa.jenis_simpanan_id = v_jenis_simpanan_id
              AND psa.aktif = TRUE
              AND p_tanggal_proses BETWEEN psa.berlaku_mulai AND COALESCE(psa.berlaku_sampai, DATE '2999-12-31')
            ORDER BY psa.berlaku_mulai DESC, psa.id DESC
            LIMIT 1
        ) psa ON TRUE
        WHERE a.status_anggota <> 'KELUAR'
          AND (a.tanggal_keluar_koperasi IS NULL OR a.tanggal_keluar_koperasi >= p_tanggal_proses)
    )
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
        FORMAT('TG-%s-%s-%s', v_kode_simpanan, TO_CHAR(p_tanggal_proses, 'YYYYMM'), LPAD(k.anggota_id::TEXT, 6, '0')),
        k.anggota_id,
        v_jenis_simpanan_id,
        TO_CHAR(p_tanggal_proses, 'YYYY-MM'),
        v_periode_tahun,
        v_periode_bulan,
        p_tanggal_proses,
        (DATE_TRUNC('month', p_tanggal_proses)::DATE + INTERVAL '1 month - 1 day')::DATE,
        k.nominal_tagihan,
        0,
        'BELUM_BAYAR',
        FORMAT('Tagihan simpanan wajib bulanan. Sumber nominal: %s.', k.sumber_nominal),
        v_batch_id
    FROM kandidat k
    WHERE k.nominal_tagihan IS NOT NULL
      AND NOT EXISTS (
          SELECT 1
          FROM tagihan_simpanan ts
          WHERE ts.anggota_id = k.anggota_id
            AND ts.jenis_simpanan_id = v_jenis_simpanan_id
            AND ts.periode_tahun = v_periode_tahun
            AND ts.periode_bulan = v_periode_bulan
      );

    GET DIAGNOSTICS v_total_tagihan_terbentuk = ROW_COUNT;

    WITH kandidat AS (
        SELECT
            a.id AS anggota_id,
            COALESCE(psa.nominal, v_nominal_default) AS nominal_tagihan
        FROM anggota a
        LEFT JOIN LATERAL (
            SELECT
                psa.id,
                psa.nominal
            FROM pengaturan_simpanan_anggota psa
            WHERE psa.anggota_id = a.id
              AND psa.jenis_simpanan_id = v_jenis_simpanan_id
              AND psa.aktif = TRUE
              AND p_tanggal_proses BETWEEN psa.berlaku_mulai AND COALESCE(psa.berlaku_sampai, DATE '2999-12-31')
            ORDER BY psa.berlaku_mulai DESC, psa.id DESC
            LIMIT 1
        ) psa ON TRUE
        WHERE a.status_anggota <> 'KELUAR'
          AND (a.tanggal_keluar_koperasi IS NULL OR a.tanggal_keluar_koperasi >= p_tanggal_proses)
    )
    SELECT COUNT(*)
    INTO v_total_anggota_tanpa_nominal
    FROM kandidat
    WHERE nominal_tagihan IS NULL;

    UPDATE batch_generate_tagihan_simpanan
    SET
        total_anggota = v_total_anggota,
        total_tagihan_terbentuk = v_total_tagihan_terbentuk,
        status_batch = 'SELESAI',
        catatan = CASE
            WHEN v_total_anggota_tanpa_nominal > 0 THEN
                FORMAT(
                    'Generate simpanan wajib selesai. %s anggota belum memiliki nominal simpanan wajib untuk periode ini.',
                    v_total_anggota_tanpa_nominal
                )
            ELSE
                'Generate simpanan wajib selesai. Semua anggota aktif memiliki nominal untuk periode ini.'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_batch_id;

    PERFORM fn_refresh_saldo_simpanan_anggota(NULL, v_jenis_simpanan_id);

    RETURN QUERY
    SELECT
        v_batch_id,
        v_periode_tahun,
        v_periode_bulan,
        v_total_anggota,
        v_total_tagihan_terbentuk,
        'SELESAI'::VARCHAR(20);
END;
$$;
