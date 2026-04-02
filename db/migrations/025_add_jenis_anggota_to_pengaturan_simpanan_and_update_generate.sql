ALTER TABLE pengaturan_simpanan
ADD COLUMN IF NOT EXISTS jenis_anggota VARCHAR(20);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_pengaturan_simpanan_jenis_anggota'
    ) THEN
        ALTER TABLE pengaturan_simpanan
        ADD CONSTRAINT ck_pengaturan_simpanan_jenis_anggota
            CHECK (jenis_anggota IS NULL OR jenis_anggota IN ('BIASA', 'LUAR_BIASA'));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_pengaturan_simpanan_jenis_anggota
    ON pengaturan_simpanan (jenis_simpanan_id, jenis_anggota, aktif, berlaku_mulai, berlaku_sampai);


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
    v_periode_tahun SMALLINT;
    v_periode_bulan SMALLINT;
    v_batch_id BIGINT;
    v_total_anggota INTEGER;
    v_total_tagihan_terbentuk INTEGER := 0;
    v_total_tagihan_auto_lunas INTEGER := 0;
    v_total_tagihan_manual INTEGER := 0;
    v_total_anggota_tanpa_nominal INTEGER := 0;
BEGIN
    SELECT js.id, js.kode
    INTO v_jenis_simpanan_id, v_kode_simpanan
    FROM jenis_simpanan js
    WHERE js.kode = 'SW'
      AND js.aktif = TRUE;

    IF v_jenis_simpanan_id IS NULL THEN
        RAISE EXCEPTION 'Jenis simpanan wajib (SW) tidak ditemukan atau tidak aktif.';
    END IF;

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
        'Generate simpanan wajib bulanan dengan nominal per periode dan jenis anggota.',
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
      AND (a.tanggal_keluar_koperasi IS NULL OR a.tanggal_keluar_koperasi > p_tanggal_proses);

    WITH kandidat AS (
        SELECT
            a.id AS anggota_id,
            a.no_anggota,
            a.jenis_anggota,
            a.status_anggota,
            COALESCE(psa.nominal, ps_jenis.nominal, ps_umum.nominal) AS nominal_tagihan,
            CASE
                WHEN psa.id IS NOT NULL THEN 'PENGATURAN_ANGGOTA'
                WHEN ps_jenis.id IS NOT NULL THEN FORMAT('PENGATURAN_JENIS_%s', a.jenis_anggota)
                WHEN ps_umum.id IS NOT NULL THEN 'PENGATURAN_UMUM'
                ELSE 'TIDAK_ADA_PENGATURAN'
            END AS sumber_nominal,
            CASE
                WHEN a.jenis_anggota = 'BIASA' AND a.status_anggota = 'AKTIF' THEN TRUE
                ELSE FALSE
            END AS auto_lunas
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
        LEFT JOIN LATERAL (
            SELECT
                ps.id,
                ps.nominal
            FROM pengaturan_simpanan ps
            WHERE ps.jenis_simpanan_id = v_jenis_simpanan_id
              AND ps.jenis_anggota = a.jenis_anggota
              AND ps.aktif = TRUE
              AND p_tanggal_proses BETWEEN ps.berlaku_mulai AND COALESCE(ps.berlaku_sampai, DATE '2999-12-31')
            ORDER BY ps.berlaku_mulai DESC, ps.id DESC
            LIMIT 1
        ) ps_jenis ON TRUE
        LEFT JOIN LATERAL (
            SELECT
                ps.id,
                ps.nominal
            FROM pengaturan_simpanan ps
            WHERE ps.jenis_simpanan_id = v_jenis_simpanan_id
              AND ps.jenis_anggota IS NULL
              AND ps.aktif = TRUE
              AND p_tanggal_proses BETWEEN ps.berlaku_mulai AND COALESCE(ps.berlaku_sampai, DATE '2999-12-31')
            ORDER BY ps.berlaku_mulai DESC, ps.id DESC
            LIMIT 1
        ) ps_umum ON TRUE
        WHERE a.status_anggota <> 'KELUAR'
          AND (a.tanggal_keluar_koperasi IS NULL OR a.tanggal_keluar_koperasi > p_tanggal_proses)
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
            FORMAT('TG-%s-%s-%s', v_kode_simpanan, TO_CHAR(p_tanggal_proses, 'YYYYMM'), LPAD(k.anggota_id::TEXT, 6, '0')),
            k.anggota_id,
            v_jenis_simpanan_id,
            TO_CHAR(p_tanggal_proses, 'YYYY-MM'),
            v_periode_tahun,
            v_periode_bulan,
            p_tanggal_proses,
            (DATE_TRUNC('month', p_tanggal_proses)::DATE + INTERVAL '1 month - 1 day')::DATE,
            k.nominal_tagihan,
            CASE
                WHEN k.auto_lunas THEN k.nominal_tagihan
                ELSE 0
            END,
            CASE
                WHEN k.auto_lunas THEN 'LUNAS'
                ELSE 'BELUM_BAYAR'
            END,
            FORMAT(
                'Tagihan simpanan wajib bulanan. Sumber nominal: %s. Mode: %s.',
                k.sumber_nominal,
                CASE
                    WHEN k.auto_lunas THEN 'AUTO_LUNAS_BIASA_AKTIF'
                    ELSE 'MANUAL'
                END
            ),
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
          )
        RETURNING id, anggota_id, nominal_tagihan
    ),
    transaksi_otomatis AS (
        INSERT INTO transaksi_simpanan (
            no_transaksi,
            tanggal_transaksi,
            anggota_id,
            jenis_simpanan_id,
            model_transaksi,
            tipe_transaksi,
            metode_bayar,
            nominal,
            keterangan,
            created_by
        )
        SELECT
            FORMAT(
                'TRX-%s-AUTO-%s-%s',
                v_kode_simpanan,
                TO_CHAR(p_tanggal_proses, 'YYYYMM'),
                LPAD(tb.anggota_id::TEXT, 6, '0')
            ),
            p_tanggal_proses,
            tb.anggota_id,
            v_jenis_simpanan_id,
            'PEMBAYARAN_TAGIHAN',
            'SETOR',
            'POTONG_GAJI',
            tb.nominal_tagihan,
            'Pelunasan otomatis simpanan wajib bulanan untuk anggota biasa aktif.',
            p_dibuat_oleh
        FROM tagihan_baru tb
        JOIN anggota a ON a.id = tb.anggota_id
        WHERE a.jenis_anggota = 'BIASA'
          AND a.status_anggota = 'AKTIF'
        RETURNING id, anggota_id
    ),
    alokasi_otomatis AS (
        INSERT INTO alokasi_pembayaran_simpanan (
            transaksi_simpanan_id,
            tagihan_simpanan_id,
            nominal_alokasi
        )
        SELECT
            ta.id,
            tb.id,
            tb.nominal_tagihan
        FROM transaksi_otomatis ta
        JOIN tagihan_baru tb ON tb.anggota_id = ta.anggota_id
        RETURNING id
    )
    SELECT
        (SELECT COUNT(*) FROM tagihan_baru),
        (
            SELECT COUNT(*)
            FROM tagihan_baru tb
            JOIN anggota a ON a.id = tb.anggota_id
            WHERE a.jenis_anggota = 'BIASA'
              AND a.status_anggota = 'AKTIF'
        ),
        (
            SELECT COUNT(*)
            FROM tagihan_baru tb
            JOIN anggota a ON a.id = tb.anggota_id
            WHERE NOT (a.jenis_anggota = 'BIASA' AND a.status_anggota = 'AKTIF')
        )
    INTO
        v_total_tagihan_terbentuk,
        v_total_tagihan_auto_lunas,
        v_total_tagihan_manual;

    WITH kandidat AS (
        SELECT
            a.id AS anggota_id,
            COALESCE(psa.nominal, ps_jenis.nominal, ps_umum.nominal) AS nominal_tagihan
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
        LEFT JOIN LATERAL (
            SELECT
                ps.id,
                ps.nominal
            FROM pengaturan_simpanan ps
            WHERE ps.jenis_simpanan_id = v_jenis_simpanan_id
              AND ps.jenis_anggota = a.jenis_anggota
              AND ps.aktif = TRUE
              AND p_tanggal_proses BETWEEN ps.berlaku_mulai AND COALESCE(ps.berlaku_sampai, DATE '2999-12-31')
            ORDER BY ps.berlaku_mulai DESC, ps.id DESC
            LIMIT 1
        ) ps_jenis ON TRUE
        LEFT JOIN LATERAL (
            SELECT
                ps.id,
                ps.nominal
            FROM pengaturan_simpanan ps
            WHERE ps.jenis_simpanan_id = v_jenis_simpanan_id
              AND ps.jenis_anggota IS NULL
              AND ps.aktif = TRUE
              AND p_tanggal_proses BETWEEN ps.berlaku_mulai AND COALESCE(ps.berlaku_sampai, DATE '2999-12-31')
            ORDER BY ps.berlaku_mulai DESC, ps.id DESC
            LIMIT 1
        ) ps_umum ON TRUE
        WHERE a.status_anggota <> 'KELUAR'
          AND (a.tanggal_keluar_koperasi IS NULL OR a.tanggal_keluar_koperasi > p_tanggal_proses)
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
        catatan = FORMAT(
            'Generate simpanan wajib selesai. Auto lunas anggota biasa aktif: %s. Tagihan manual luar biasa/pasif: %s. Anggota tanpa nominal: %s.',
            v_total_tagihan_auto_lunas,
            v_total_tagihan_manual,
            v_total_anggota_tanpa_nominal
        ),
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
