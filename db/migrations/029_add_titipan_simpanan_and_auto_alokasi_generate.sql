CREATE TABLE IF NOT EXISTS titipan_simpanan_anggota (
    id BIGSERIAL PRIMARY KEY,
    anggota_id BIGINT NOT NULL REFERENCES anggota (id),
    jenis_simpanan_id BIGINT NOT NULL REFERENCES jenis_simpanan (id),
    saldo_titipan NUMERIC(18, 2) NOT NULL DEFAULT 0,
    terakhir_dihitung_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_titipan_simpanan_anggota UNIQUE (anggota_id, jenis_simpanan_id),
    CONSTRAINT ck_titipan_simpanan_anggota_saldo
        CHECK (saldo_titipan >= 0)
);

CREATE INDEX IF NOT EXISTS idx_titipan_simpanan_anggota_anggota
    ON titipan_simpanan_anggota (anggota_id);

CREATE INDEX IF NOT EXISTS idx_titipan_simpanan_anggota_jenis
    ON titipan_simpanan_anggota (jenis_simpanan_id);


CREATE TABLE IF NOT EXISTS mutasi_titipan_simpanan (
    id BIGSERIAL PRIMARY KEY,
    no_mutasi VARCHAR(50) NOT NULL,
    tanggal_mutasi DATE NOT NULL,
    anggota_id BIGINT NOT NULL REFERENCES anggota (id),
    jenis_simpanan_id BIGINT NOT NULL REFERENCES jenis_simpanan (id),
    tipe_mutasi VARCHAR(20) NOT NULL,
    nominal NUMERIC(18, 2) NOT NULL,
    referensi_transaksi_simpanan_id BIGINT REFERENCES transaksi_simpanan (id),
    referensi_tagihan_simpanan_id BIGINT REFERENCES tagihan_simpanan (id),
    keterangan TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_mutasi_titipan_simpanan_no_mutasi UNIQUE (no_mutasi),
    CONSTRAINT ck_mutasi_titipan_simpanan_tipe
        CHECK (tipe_mutasi IN ('MASUK', 'PAKAI', 'KOREKSI_MASUK', 'KOREKSI_KELUAR', 'REFUND')),
    CONSTRAINT ck_mutasi_titipan_simpanan_nominal
        CHECK (nominal > 0)
);

CREATE INDEX IF NOT EXISTS idx_mutasi_titipan_simpanan_anggota
    ON mutasi_titipan_simpanan (anggota_id);

CREATE INDEX IF NOT EXISTS idx_mutasi_titipan_simpanan_jenis
    ON mutasi_titipan_simpanan (jenis_simpanan_id);

CREATE INDEX IF NOT EXISTS idx_mutasi_titipan_simpanan_tanggal
    ON mutasi_titipan_simpanan (tanggal_mutasi);

CREATE INDEX IF NOT EXISTS idx_mutasi_titipan_simpanan_transaksi
    ON mutasi_titipan_simpanan (referensi_transaksi_simpanan_id);


CREATE OR REPLACE FUNCTION fn_refresh_titipan_simpanan_anggota(
    p_anggota_id BIGINT DEFAULT NULL,
    p_jenis_simpanan_id BIGINT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_affected_rows INTEGER;
BEGIN
    INSERT INTO titipan_simpanan_anggota (
        anggota_id,
        jenis_simpanan_id,
        saldo_titipan,
        terakhir_dihitung_at,
        updated_at
    )
    SELECT
        a.id AS anggota_id,
        js.id AS jenis_simpanan_id,
        GREATEST(
            COALESCE(mutasi.total_masuk, 0) - COALESCE(mutasi.total_keluar, 0),
            0
        ) AS saldo_titipan,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM anggota a
    CROSS JOIN jenis_simpanan js
    LEFT JOIN (
        SELECT
            mts.anggota_id,
            mts.jenis_simpanan_id,
            SUM(
                CASE
                    WHEN mts.tipe_mutasi IN ('MASUK', 'KOREKSI_MASUK') THEN mts.nominal
                    ELSE 0
                END
            ) AS total_masuk,
            SUM(
                CASE
                    WHEN mts.tipe_mutasi IN ('PAKAI', 'KOREKSI_KELUAR', 'REFUND') THEN mts.nominal
                    ELSE 0
                END
            ) AS total_keluar
        FROM mutasi_titipan_simpanan mts
        GROUP BY mts.anggota_id, mts.jenis_simpanan_id
    ) mutasi
        ON mutasi.anggota_id = a.id
       AND mutasi.jenis_simpanan_id = js.id
    WHERE (p_anggota_id IS NULL OR a.id = p_anggota_id)
      AND (p_jenis_simpanan_id IS NULL OR js.id = p_jenis_simpanan_id)
    ON CONFLICT (anggota_id, jenis_simpanan_id)
    DO UPDATE SET
        saldo_titipan = EXCLUDED.saldo_titipan,
        terakhir_dihitung_at = EXCLUDED.terakhir_dihitung_at,
        updated_at = CURRENT_TIMESTAMP;

    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    RETURN v_affected_rows;
END;
$$;


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
    v_total_tagihan_titipan INTEGER := 0;
    v_total_nominal_titipan NUMERIC(18, 2) := 0;
    v_titipan_result RECORD;
    v_row RECORD;
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
        'Generate simpanan wajib bulanan dengan auto lunas untuk segmen aktif, manual untuk luar biasa pasif, dan auto pakai titipan bila tersedia.',
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
            CASE
                WHEN a.jenis_anggota = 'BIASA' AND a.status_anggota = 'AKTIF' THEN 'BIASA_AKTIF'
                WHEN a.jenis_anggota = 'LUAR_BIASA' AND a.status_anggota = 'AKTIF' THEN 'LUAR_BIASA_AKTIF'
                WHEN a.jenis_anggota = 'LUAR_BIASA' AND a.status_anggota = 'PASIF' THEN 'LUAR_BIASA_PASIF'
                ELSE NULL
            END AS segmen_anggota,
            COALESCE(psa.nominal, ps_segmen.nominal, ps_umum.nominal) AS nominal_tagihan,
            CASE
                WHEN psa.id IS NOT NULL THEN 'PENGATURAN_ANGGOTA'
                WHEN ps_segmen.id IS NOT NULL THEN FORMAT(
                    'PENGATURAN_SEGMEN_%s',
                    COALESCE(
                        CASE
                            WHEN a.jenis_anggota = 'BIASA' AND a.status_anggota = 'AKTIF' THEN 'BIASA_AKTIF'
                            WHEN a.jenis_anggota = 'LUAR_BIASA' AND a.status_anggota = 'AKTIF' THEN 'LUAR_BIASA_AKTIF'
                            WHEN a.jenis_anggota = 'LUAR_BIASA' AND a.status_anggota = 'PASIF' THEN 'LUAR_BIASA_PASIF'
                            ELSE 'TIDAK_TERDEFINISI'
                        END,
                        'UMUM'
                    )
                )
                WHEN ps_umum.id IS NOT NULL THEN 'PENGATURAN_UMUM'
                ELSE 'TIDAK_ADA_PENGATURAN'
            END AS sumber_nominal,
            CASE
                WHEN a.status_anggota = 'AKTIF'
                 AND a.jenis_anggota IN ('BIASA', 'LUAR_BIASA') THEN TRUE
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
              AND ps.segmen_anggota = CASE
                  WHEN a.jenis_anggota = 'BIASA' AND a.status_anggota = 'AKTIF' THEN 'BIASA_AKTIF'
                  WHEN a.jenis_anggota = 'LUAR_BIASA' AND a.status_anggota = 'AKTIF' THEN 'LUAR_BIASA_AKTIF'
                  WHEN a.jenis_anggota = 'LUAR_BIASA' AND a.status_anggota = 'PASIF' THEN 'LUAR_BIASA_PASIF'
                  ELSE NULL
              END
              AND ps.aktif = TRUE
              AND p_tanggal_proses BETWEEN ps.berlaku_mulai AND COALESCE(ps.berlaku_sampai, DATE '2999-12-31')
            ORDER BY ps.berlaku_mulai DESC, ps.id DESC
            LIMIT 1
        ) ps_segmen ON TRUE
        LEFT JOIN LATERAL (
            SELECT
                ps.id,
                ps.nominal
            FROM pengaturan_simpanan ps
            WHERE ps.jenis_simpanan_id = v_jenis_simpanan_id
              AND ps.segmen_anggota IS NULL
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
                    WHEN k.auto_lunas THEN 'AUTO_LUNAS_SEGMEN_AKTIF'
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
            'Pelunasan otomatis simpanan wajib bulanan untuk anggota aktif.',
            p_dibuat_oleh
        FROM tagihan_baru tb
        JOIN anggota a ON a.id = tb.anggota_id
        WHERE a.status_anggota = 'AKTIF'
          AND a.jenis_anggota IN ('BIASA', 'LUAR_BIASA')
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
            WHERE a.status_anggota = 'AKTIF'
              AND a.jenis_anggota IN ('BIASA', 'LUAR_BIASA')
        ),
        (
            SELECT COUNT(*)
            FROM tagihan_baru tb
            JOIN anggota a ON a.id = tb.anggota_id
            WHERE NOT (a.status_anggota = 'AKTIF' AND a.jenis_anggota IN ('BIASA', 'LUAR_BIASA'))
        )
    INTO
        v_total_tagihan_terbentuk,
        v_total_tagihan_auto_lunas,
        v_total_tagihan_manual;

    FOR v_row IN
        SELECT DISTINCT tb.anggota_id
        FROM tagihan_simpanan tb
        JOIN anggota a ON a.id = tb.anggota_id
        WHERE tb.batch_generate_tagihan_simpanan_id = v_batch_id
          AND NOT (a.status_anggota = 'AKTIF' AND a.jenis_anggota IN ('BIASA', 'LUAR_BIASA'))
    LOOP
        SELECT *
        INTO v_titipan_result
        FROM fn_auto_alokasikan_titipan_simpanan(
            v_row.anggota_id,
            v_jenis_simpanan_id,
            p_tanggal_proses,
            p_dibuat_oleh,
            'Auto alokasi titipan saat generate simpanan wajib bulanan.'
        );

        v_total_tagihan_titipan := v_total_tagihan_titipan + COALESCE(v_titipan_result.total_tagihan_teralokasi, 0);
        v_total_nominal_titipan := v_total_nominal_titipan + COALESCE(v_titipan_result.total_nominal_teralokasi, 0);
    END LOOP;

    WITH kandidat AS (
        SELECT
            a.id AS anggota_id,
            COALESCE(psa.nominal, ps_segmen.nominal, ps_umum.nominal) AS nominal_tagihan
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
              AND ps.segmen_anggota = CASE
                  WHEN a.jenis_anggota = 'BIASA' AND a.status_anggota = 'AKTIF' THEN 'BIASA_AKTIF'
                  WHEN a.jenis_anggota = 'LUAR_BIASA' AND a.status_anggota = 'AKTIF' THEN 'LUAR_BIASA_AKTIF'
                  WHEN a.jenis_anggota = 'LUAR_BIASA' AND a.status_anggota = 'PASIF' THEN 'LUAR_BIASA_PASIF'
                  ELSE NULL
              END
              AND ps.aktif = TRUE
              AND p_tanggal_proses BETWEEN ps.berlaku_mulai AND COALESCE(ps.berlaku_sampai, DATE '2999-12-31')
            ORDER BY ps.berlaku_mulai DESC, ps.id DESC
            LIMIT 1
        ) ps_segmen ON TRUE
        LEFT JOIN LATERAL (
            SELECT
                ps.id,
                ps.nominal
            FROM pengaturan_simpanan ps
            WHERE ps.jenis_simpanan_id = v_jenis_simpanan_id
              AND ps.segmen_anggota IS NULL
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
            'Generate simpanan wajib selesai. Auto lunas segmen aktif: %s. Tagihan manual luar biasa pasif: %s. Auto pakai titipan: %s tagihan / %s. Anggota tanpa nominal: %s.',
            v_total_tagihan_auto_lunas,
            v_total_tagihan_manual,
            v_total_tagihan_titipan,
            COALESCE(v_total_nominal_titipan, 0),
            v_total_anggota_tanpa_nominal
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_batch_id;

    PERFORM fn_refresh_saldo_simpanan_anggota(NULL, v_jenis_simpanan_id);
    PERFORM fn_refresh_titipan_simpanan_anggota(NULL, v_jenis_simpanan_id);

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


CREATE OR REPLACE FUNCTION fn_bayar_tagihan_simpanan(
    p_no_anggota VARCHAR(30),
    p_kode_simpanan VARCHAR(30),
    p_tanggal_transaksi DATE,
    p_nominal_bayar NUMERIC(18, 2),
    p_metode_bayar VARCHAR(20) DEFAULT 'TRANSFER',
    p_keterangan TEXT DEFAULT NULL,
    p_created_by VARCHAR(100) DEFAULT 'system'
)
RETURNS TABLE (
    transaksi_id BIGINT,
    total_tagihan_teralokasi INTEGER,
    total_nominal_teralokasi NUMERIC(18, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_anggota_id BIGINT;
    v_jenis_anggota VARCHAR(20);
    v_status_anggota VARCHAR(20);
    v_jenis_simpanan_id BIGINT;
    v_kode_simpanan VARCHAR(30);
    v_model_pencatatan VARCHAR(20);
    v_total_sisa_tagihan NUMERIC(18, 2) := 0;
    v_suffix_transaksi TEXT;
    v_suffix_mutasi TEXT;
    v_transaksi_id BIGINT;
    v_sisa_pembayaran NUMERIC(18, 2);
    v_nominal_alokasi NUMERIC(18, 2);
    v_total_tagihan_teralokasi INTEGER := 0;
    v_total_nominal_teralokasi NUMERIC(18, 2) := 0;
    v_row RECORD;
BEGIN
    IF p_nominal_bayar IS NULL OR p_nominal_bayar <= 0 THEN
        RAISE EXCEPTION 'Nominal bayar harus lebih besar dari 0.';
    END IF;

    SELECT a.id, a.jenis_anggota, a.status_anggota
    INTO v_anggota_id, v_jenis_anggota, v_status_anggota
    FROM anggota a
    WHERE a.no_anggota = p_no_anggota;

    IF v_anggota_id IS NULL THEN
        RAISE EXCEPTION 'Anggota dengan no_anggota % tidak ditemukan.', p_no_anggota;
    END IF;

    SELECT js.id, js.kode, js.model_pencatatan
    INTO v_jenis_simpanan_id, v_kode_simpanan, v_model_pencatatan
    FROM jenis_simpanan js
    WHERE js.kode = p_kode_simpanan
      AND js.aktif = TRUE;

    IF v_jenis_simpanan_id IS NULL THEN
        RAISE EXCEPTION 'Jenis simpanan dengan kode % tidak ditemukan atau tidak aktif.', p_kode_simpanan;
    END IF;

    IF v_model_pencatatan <> 'TAGIHAN' THEN
        RAISE EXCEPTION 'Jenis simpanan % bukan tipe tagihan.', p_kode_simpanan;
    END IF;

    IF v_kode_simpanan = 'SW' AND v_status_anggota = 'KELUAR' THEN
        RAISE EXCEPTION 'Anggota yang sudah keluar tidak dapat melakukan pembayaran simpanan wajib.';
    END IF;

    SELECT COALESCE(SUM(ts.nominal_tagihan - ts.nominal_terbayar), 0)
    INTO v_total_sisa_tagihan
    FROM tagihan_simpanan ts
    WHERE ts.anggota_id = v_anggota_id
      AND ts.jenis_simpanan_id = v_jenis_simpanan_id
      AND ts.status_tagihan IN ('BELUM_BAYAR', 'SEBAGIAN')
      AND (ts.nominal_tagihan - ts.nominal_terbayar) > 0;

    IF v_kode_simpanan <> 'SW' AND v_total_sisa_tagihan <= 0 THEN
        RAISE EXCEPTION 'Tidak ada tagihan terbuka untuk anggota % dan simpanan %.', p_no_anggota, p_kode_simpanan;
    END IF;

    IF v_kode_simpanan <> 'SW' AND p_nominal_bayar > v_total_sisa_tagihan THEN
        RAISE EXCEPTION
            'Nominal bayar % melebihi sisa tagihan terbuka % untuk anggota % dan simpanan %.',
            p_nominal_bayar,
            v_total_sisa_tagihan,
            p_no_anggota,
            p_kode_simpanan;
    END IF;

    v_suffix_transaksi := TO_CHAR(CLOCK_TIMESTAMP(), 'HH24MISSMS');

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
    VALUES (
        FORMAT(
            'TRX-%s-%s-%s-%s',
            p_kode_simpanan,
            TO_CHAR(p_tanggal_transaksi, 'YYYYMMDD'),
            LPAD(v_anggota_id::TEXT, 6, '0'),
            v_suffix_transaksi
        ),
        p_tanggal_transaksi,
        v_anggota_id,
        v_jenis_simpanan_id,
        'PEMBAYARAN_TAGIHAN',
        'SETOR',
        p_metode_bayar,
        p_nominal_bayar,
        COALESCE(
            p_keterangan,
            FORMAT(
                'Pembayaran tagihan simpanan %s untuk anggota %s (%s/%s).',
                p_kode_simpanan,
                p_no_anggota,
                v_jenis_anggota,
                v_status_anggota
            )
        ),
        p_created_by
    )
    RETURNING id INTO v_transaksi_id;

    v_sisa_pembayaran := p_nominal_bayar;

    FOR v_row IN
        SELECT
            ts.id,
            (ts.nominal_tagihan - ts.nominal_terbayar) AS sisa_tagihan
        FROM tagihan_simpanan ts
        WHERE ts.anggota_id = v_anggota_id
          AND ts.jenis_simpanan_id = v_jenis_simpanan_id
          AND ts.status_tagihan IN ('BELUM_BAYAR', 'SEBAGIAN')
          AND (ts.nominal_tagihan - ts.nominal_terbayar) > 0
        ORDER BY COALESCE(ts.periode_tahun, 0), COALESCE(ts.periode_bulan, 0), ts.tanggal_tagihan, ts.id
    LOOP
        EXIT WHEN v_sisa_pembayaran <= 0;

        v_nominal_alokasi := LEAST(v_sisa_pembayaran, v_row.sisa_tagihan);

        IF v_nominal_alokasi <= 0 THEN
            CONTINUE;
        END IF;

        INSERT INTO alokasi_pembayaran_simpanan (
            transaksi_simpanan_id,
            tagihan_simpanan_id,
            nominal_alokasi
        )
        VALUES (
            v_transaksi_id,
            v_row.id,
            v_nominal_alokasi
        );

        UPDATE tagihan_simpanan ts
        SET
            nominal_terbayar = ts.nominal_terbayar + v_nominal_alokasi,
            status_tagihan = CASE
                WHEN ts.nominal_terbayar + v_nominal_alokasi >= ts.nominal_tagihan THEN 'LUNAS'
                WHEN ts.nominal_terbayar + v_nominal_alokasi > 0 THEN 'SEBAGIAN'
                ELSE 'BELUM_BAYAR'
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE ts.id = v_row.id;

        v_sisa_pembayaran := v_sisa_pembayaran - v_nominal_alokasi;
        v_total_tagihan_teralokasi := v_total_tagihan_teralokasi + 1;
        v_total_nominal_teralokasi := v_total_nominal_teralokasi + v_nominal_alokasi;
    END LOOP;

    IF v_sisa_pembayaran > 0 THEN
        IF v_kode_simpanan <> 'SW' THEN
            RAISE EXCEPTION 'Masih ada sisa pembayaran % yang belum teralokasi.', v_sisa_pembayaran;
        END IF;

        v_suffix_mutasi := TO_CHAR(CLOCK_TIMESTAMP(), 'HH24MISSMS');

        INSERT INTO mutasi_titipan_simpanan (
            no_mutasi,
            tanggal_mutasi,
            anggota_id,
            jenis_simpanan_id,
            tipe_mutasi,
            nominal,
            referensi_transaksi_simpanan_id,
            keterangan,
            created_by
        )
        VALUES (
            FORMAT(
                'TTP-%s-MASUK-%s-%s-%s',
                v_kode_simpanan,
                TO_CHAR(p_tanggal_transaksi, 'YYYYMMDD'),
                LPAD(v_anggota_id::TEXT, 6, '0'),
                v_suffix_mutasi
            ),
            p_tanggal_transaksi,
            v_anggota_id,
            v_jenis_simpanan_id,
            'MASUK',
            v_sisa_pembayaran,
            v_transaksi_id,
            COALESCE(
                p_keterangan,
                FORMAT('Titipan pembayaran simpanan %s untuk anggota %s.', v_kode_simpanan, p_no_anggota)
            ),
            p_created_by
        );
    END IF;

    PERFORM fn_refresh_saldo_simpanan_anggota(v_anggota_id, v_jenis_simpanan_id);
    PERFORM fn_refresh_titipan_simpanan_anggota(v_anggota_id, v_jenis_simpanan_id);

    RETURN QUERY
    SELECT
        v_transaksi_id,
        v_total_tagihan_teralokasi,
        v_total_nominal_teralokasi;
END;
$$;


CREATE OR REPLACE FUNCTION fn_auto_alokasikan_titipan_simpanan(
    p_anggota_id BIGINT,
    p_jenis_simpanan_id BIGINT,
    p_tanggal_transaksi DATE DEFAULT CURRENT_DATE,
    p_created_by VARCHAR(100) DEFAULT 'system',
    p_keterangan TEXT DEFAULT NULL
)
RETURNS TABLE (
    transaksi_id BIGINT,
    total_tagihan_teralokasi INTEGER,
    total_nominal_teralokasi NUMERIC(18, 2),
    sisa_titipan NUMERIC(18, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_kode_simpanan VARCHAR(30);
    v_saldo_titipan NUMERIC(18, 2) := 0;
    v_total_sisa_tagihan NUMERIC(18, 2) := 0;
    v_nominal_digunakan NUMERIC(18, 2) := 0;
    v_transaksi_id BIGINT;
    v_suffix_transaksi TEXT;
    v_suffix_mutasi TEXT;
    v_total_tagihan_teralokasi INTEGER := 0;
    v_total_nominal_teralokasi NUMERIC(18, 2) := 0;
    v_sisa_pemakaian NUMERIC(18, 2) := 0;
    v_nominal_alokasi NUMERIC(18, 2) := 0;
    v_row RECORD;
BEGIN
    SELECT js.kode
    INTO v_kode_simpanan
    FROM jenis_simpanan js
    WHERE js.id = p_jenis_simpanan_id;

    SELECT COALESCE(tsa.saldo_titipan, 0)
    INTO v_saldo_titipan
    FROM titipan_simpanan_anggota tsa
    WHERE tsa.anggota_id = p_anggota_id
      AND tsa.jenis_simpanan_id = p_jenis_simpanan_id;

    SELECT COALESCE(SUM(ts.nominal_tagihan - ts.nominal_terbayar), 0)
    INTO v_total_sisa_tagihan
    FROM tagihan_simpanan ts
    WHERE ts.anggota_id = p_anggota_id
      AND ts.jenis_simpanan_id = p_jenis_simpanan_id
      AND ts.status_tagihan IN ('BELUM_BAYAR', 'SEBAGIAN')
      AND (ts.nominal_tagihan - ts.nominal_terbayar) > 0;

    v_nominal_digunakan := LEAST(COALESCE(v_saldo_titipan, 0), COALESCE(v_total_sisa_tagihan, 0));

    IF v_nominal_digunakan <= 0 THEN
        RETURN QUERY
        SELECT
            NULL::BIGINT,
            0::INTEGER,
            0::NUMERIC(18, 2),
            COALESCE(v_saldo_titipan, 0);
        RETURN;
    END IF;

    v_suffix_transaksi := TO_CHAR(CLOCK_TIMESTAMP(), 'HH24MISSMS');

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
    VALUES (
        FORMAT(
            'TRX-%s-TITIPAN-%s-%s-%s',
            v_kode_simpanan,
            TO_CHAR(p_tanggal_transaksi, 'YYYYMMDD'),
            LPAD(p_anggota_id::TEXT, 6, '0'),
            v_suffix_transaksi
        ),
        p_tanggal_transaksi,
        p_anggota_id,
        p_jenis_simpanan_id,
        'PEMBAYARAN_TAGIHAN',
        'SETOR',
        'DEBET_SALDO',
        v_nominal_digunakan,
        COALESCE(
            p_keterangan,
            FORMAT('Auto alokasi titipan simpanan %s ke tagihan terbuka.', COALESCE(v_kode_simpanan, '-'))
        ),
        p_created_by
    )
    RETURNING id INTO v_transaksi_id;

    v_sisa_pemakaian := v_nominal_digunakan;

    FOR v_row IN
        SELECT
            ts.id,
            (ts.nominal_tagihan - ts.nominal_terbayar) AS sisa_tagihan
        FROM tagihan_simpanan ts
        WHERE ts.anggota_id = p_anggota_id
          AND ts.jenis_simpanan_id = p_jenis_simpanan_id
          AND ts.status_tagihan IN ('BELUM_BAYAR', 'SEBAGIAN')
          AND (ts.nominal_tagihan - ts.nominal_terbayar) > 0
        ORDER BY COALESCE(ts.periode_tahun, 0), COALESCE(ts.periode_bulan, 0), ts.tanggal_tagihan, ts.id
    LOOP
        EXIT WHEN v_sisa_pemakaian <= 0;

        v_nominal_alokasi := LEAST(v_sisa_pemakaian, v_row.sisa_tagihan);

        IF v_nominal_alokasi <= 0 THEN
            CONTINUE;
        END IF;

        INSERT INTO alokasi_pembayaran_simpanan (
            transaksi_simpanan_id,
            tagihan_simpanan_id,
            nominal_alokasi
        )
        VALUES (
            v_transaksi_id,
            v_row.id,
            v_nominal_alokasi
        );

        UPDATE tagihan_simpanan ts
        SET
            nominal_terbayar = ts.nominal_terbayar + v_nominal_alokasi,
            status_tagihan = CASE
                WHEN ts.nominal_terbayar + v_nominal_alokasi >= ts.nominal_tagihan THEN 'LUNAS'
                WHEN ts.nominal_terbayar + v_nominal_alokasi > 0 THEN 'SEBAGIAN'
                ELSE 'BELUM_BAYAR'
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE ts.id = v_row.id;

        v_sisa_pemakaian := v_sisa_pemakaian - v_nominal_alokasi;
        v_total_tagihan_teralokasi := v_total_tagihan_teralokasi + 1;
        v_total_nominal_teralokasi := v_total_nominal_teralokasi + v_nominal_alokasi;
    END LOOP;

    v_suffix_mutasi := TO_CHAR(CLOCK_TIMESTAMP(), 'HH24MISSMS');

    INSERT INTO mutasi_titipan_simpanan (
        no_mutasi,
        tanggal_mutasi,
        anggota_id,
        jenis_simpanan_id,
        tipe_mutasi,
        nominal,
        referensi_transaksi_simpanan_id,
        keterangan,
        created_by
    )
    VALUES (
        FORMAT(
            'TTP-%s-PAKAI-%s-%s-%s',
            COALESCE(v_kode_simpanan, 'UNK'),
            TO_CHAR(p_tanggal_transaksi, 'YYYYMMDD'),
            LPAD(p_anggota_id::TEXT, 6, '0'),
            v_suffix_mutasi
        ),
        p_tanggal_transaksi,
        p_anggota_id,
        p_jenis_simpanan_id,
        'PAKAI',
        v_total_nominal_teralokasi,
        v_transaksi_id,
        COALESCE(
            p_keterangan,
            FORMAT('Pemakaian titipan simpanan %s untuk tagihan terbuka.', COALESCE(v_kode_simpanan, '-'))
        ),
        p_created_by
    );

    PERFORM fn_refresh_saldo_simpanan_anggota(p_anggota_id, p_jenis_simpanan_id);
    PERFORM fn_refresh_titipan_simpanan_anggota(p_anggota_id, p_jenis_simpanan_id);

    SELECT COALESCE(tsa.saldo_titipan, 0)
    INTO v_saldo_titipan
    FROM titipan_simpanan_anggota tsa
    WHERE tsa.anggota_id = p_anggota_id
      AND tsa.jenis_simpanan_id = p_jenis_simpanan_id;

    RETURN QUERY
    SELECT
        v_transaksi_id,
        v_total_tagihan_teralokasi,
        v_total_nominal_teralokasi,
        COALESCE(v_saldo_titipan, 0);
END;
$$;
