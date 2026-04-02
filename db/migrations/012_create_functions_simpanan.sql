CREATE OR REPLACE FUNCTION fn_refresh_saldo_simpanan_anggota(
    p_anggota_id BIGINT DEFAULT NULL,
    p_jenis_simpanan_id BIGINT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_affected_rows INTEGER;
BEGIN
    INSERT INTO saldo_simpanan_anggota (
        anggota_id,
        jenis_simpanan_id,
        saldo_terbentuk,
        saldo_ditahan,
        saldo_tersedia,
        total_setor,
        total_tarik,
        total_tagihan,
        total_tunggakan,
        terakhir_dihitung_at,
        updated_at
    )
    SELECT
        a.id AS anggota_id,
        js.id AS jenis_simpanan_id,
        GREATEST(
            CASE
                WHEN js.model_pencatatan = 'TAGIHAN' THEN COALESCE(alok.total_alokasi, 0)
                ELSE COALESCE(trx.total_setor, 0) - COALESCE(trx.total_tarik, 0)
            END,
            0
        ) AS saldo_terbentuk,
        CASE
            WHEN js.kode = 'SPN' THEN GREATEST(
                CASE
                    WHEN js.model_pencatatan = 'TAGIHAN' THEN COALESCE(alok.total_alokasi, 0)
                    ELSE COALESCE(trx.total_setor, 0) - COALESCE(trx.total_tarik, 0)
                END,
                0
            )
            ELSE 0
        END AS saldo_ditahan,
        CASE
            WHEN js.kode = 'SS' THEN GREATEST(COALESCE(trx.total_setor, 0) - COALESCE(trx.total_tarik, 0), 0)
            ELSE 0
        END AS saldo_tersedia,
        CASE
            WHEN js.model_pencatatan = 'TAGIHAN' THEN COALESCE(alok.total_alokasi, 0)
            ELSE COALESCE(trx.total_setor, 0)
        END AS total_setor,
        CASE
            WHEN js.model_pencatatan = 'TAGIHAN' THEN 0
            ELSE COALESCE(trx.total_tarik, 0)
        END AS total_tarik,
        COALESCE(tag.total_tagihan, 0) AS total_tagihan,
        COALESCE(tag.total_tunggakan, 0) AS total_tunggakan,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM anggota a
    CROSS JOIN jenis_simpanan js
    LEFT JOIN (
        SELECT
            ts.anggota_id,
            ts.jenis_simpanan_id,
            SUM(
                CASE
                    WHEN ts.tipe_transaksi IN ('SETOR', 'KOREKSI_MASUK')
                     AND COALESCE(ts.metode_bayar, '') <> 'DEBET_SALDO'
                    THEN ts.nominal
                    ELSE 0
                END
            ) AS total_setor,
            SUM(
                CASE
                    WHEN ts.tipe_transaksi IN ('TARIK', 'KOREKSI_KELUAR') THEN ts.nominal
                    ELSE 0
                END
            ) AS total_tarik
        FROM transaksi_simpanan ts
        GROUP BY ts.anggota_id, ts.jenis_simpanan_id
    ) trx
        ON trx.anggota_id = a.id
       AND trx.jenis_simpanan_id = js.id
    LEFT JOIN (
        SELECT
            tg.anggota_id,
            tg.jenis_simpanan_id,
            SUM(aps.nominal_alokasi) AS total_alokasi
        FROM alokasi_pembayaran_simpanan aps
        JOIN tagihan_simpanan tg ON tg.id = aps.tagihan_simpanan_id
        GROUP BY tg.anggota_id, tg.jenis_simpanan_id
    ) alok
        ON alok.anggota_id = a.id
       AND alok.jenis_simpanan_id = js.id
    LEFT JOIN (
        SELECT
            tg.anggota_id,
            tg.jenis_simpanan_id,
            SUM(tg.nominal_tagihan) AS total_tagihan,
            SUM(
                CASE
                    WHEN tg.status_tagihan IN ('BELUM_BAYAR', 'SEBAGIAN')
                    THEN (tg.nominal_tagihan - tg.nominal_terbayar)
                    ELSE 0
                END
            ) AS total_tunggakan
        FROM tagihan_simpanan tg
        GROUP BY tg.anggota_id, tg.jenis_simpanan_id
    ) tag
        ON tag.anggota_id = a.id
       AND tag.jenis_simpanan_id = js.id
    WHERE (p_anggota_id IS NULL OR a.id = p_anggota_id)
      AND (p_jenis_simpanan_id IS NULL OR js.id = p_jenis_simpanan_id)
    ON CONFLICT (anggota_id, jenis_simpanan_id)
    DO UPDATE SET
        saldo_terbentuk = EXCLUDED.saldo_terbentuk,
        saldo_ditahan = EXCLUDED.saldo_ditahan,
        saldo_tersedia = EXCLUDED.saldo_tersedia,
        total_setor = EXCLUDED.total_setor,
        total_tarik = EXCLUDED.total_tarik,
        total_tagihan = EXCLUDED.total_tagihan,
        total_tunggakan = EXCLUDED.total_tunggakan,
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
    v_nominal NUMERIC(18, 2);
    v_periode_tahun SMALLINT;
    v_periode_bulan SMALLINT;
    v_batch_id BIGINT;
    v_total_anggota INTEGER;
    v_total_tagihan_terbentuk INTEGER;
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
    INTO v_nominal
    FROM pengaturan_simpanan ps
    WHERE ps.jenis_simpanan_id = v_jenis_simpanan_id
      AND ps.aktif = TRUE
      AND p_tanggal_proses BETWEEN ps.berlaku_mulai AND COALESCE(ps.berlaku_sampai, DATE '2999-12-31')
    ORDER BY ps.berlaku_mulai DESC
    LIMIT 1;

    IF v_nominal IS NULL THEN
        RAISE EXCEPTION 'Pengaturan nominal simpanan wajib aktif tidak ditemukan untuk tanggal %.', p_tanggal_proses;
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
        'Generate simpanan wajib bulanan.',
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
        FORMAT('TG-%s-%s-%s', v_kode_simpanan, TO_CHAR(p_tanggal_proses, 'YYYYMM'), LPAD(a.id::TEXT, 6, '0')),
        a.id,
        v_jenis_simpanan_id,
        TO_CHAR(p_tanggal_proses, 'YYYY-MM'),
        v_periode_tahun,
        v_periode_bulan,
        p_tanggal_proses,
        (DATE_TRUNC('month', p_tanggal_proses)::DATE + INTERVAL '1 month - 1 day')::DATE,
        v_nominal,
        0,
        'BELUM_BAYAR',
        'Tagihan simpanan wajib bulanan.',
        v_batch_id
    FROM anggota a
    WHERE a.status_anggota <> 'KELUAR'
      AND (a.tanggal_keluar_koperasi IS NULL OR a.tanggal_keluar_koperasi >= p_tanggal_proses)
      AND NOT EXISTS (
          SELECT 1
          FROM tagihan_simpanan ts
          WHERE ts.anggota_id = a.id
            AND ts.jenis_simpanan_id = v_jenis_simpanan_id
            AND ts.periode_tahun = v_periode_tahun
            AND ts.periode_bulan = v_periode_bulan
      );

    GET DIAGNOSTICS v_total_tagihan_terbentuk = ROW_COUNT;

    UPDATE batch_generate_tagihan_simpanan
    SET
        total_anggota = v_total_anggota,
        total_tagihan_terbentuk = v_total_tagihan_terbentuk,
        status_batch = 'SELESAI',
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
    v_jenis_simpanan_id BIGINT;
    v_model_pencatatan VARCHAR(20);
    v_total_sisa_tagihan NUMERIC(18, 2);
    v_suffix_transaksi TEXT;
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

    SELECT a.id
    INTO v_anggota_id
    FROM anggota a
    WHERE a.no_anggota = p_no_anggota;

    IF v_anggota_id IS NULL THEN
        RAISE EXCEPTION 'Anggota dengan no_anggota % tidak ditemukan.', p_no_anggota;
    END IF;

    SELECT js.id, js.model_pencatatan
    INTO v_jenis_simpanan_id, v_model_pencatatan
    FROM jenis_simpanan js
    WHERE js.kode = p_kode_simpanan
      AND js.aktif = TRUE;

    IF v_jenis_simpanan_id IS NULL THEN
        RAISE EXCEPTION 'Jenis simpanan dengan kode % tidak ditemukan atau tidak aktif.', p_kode_simpanan;
    END IF;

    IF v_model_pencatatan <> 'TAGIHAN' THEN
        RAISE EXCEPTION 'Jenis simpanan % bukan tipe tagihan.', p_kode_simpanan;
    END IF;

    SELECT COALESCE(SUM(ts.nominal_tagihan - ts.nominal_terbayar), 0)
    INTO v_total_sisa_tagihan
    FROM tagihan_simpanan ts
    WHERE ts.anggota_id = v_anggota_id
      AND ts.jenis_simpanan_id = v_jenis_simpanan_id
      AND ts.status_tagihan IN ('BELUM_BAYAR', 'SEBAGIAN')
      AND (ts.nominal_tagihan - ts.nominal_terbayar) > 0;

    IF v_total_sisa_tagihan <= 0 THEN
        RAISE EXCEPTION 'Tidak ada tagihan terbuka untuk anggota % dan simpanan %.', p_no_anggota, p_kode_simpanan;
    END IF;

    IF p_nominal_bayar > v_total_sisa_tagihan THEN
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
        COALESCE(p_keterangan, FORMAT('Pembayaran tagihan simpanan %s.', p_kode_simpanan)),
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

    IF v_sisa_pembayaran <> 0 THEN
        RAISE EXCEPTION 'Masih ada sisa pembayaran % yang belum teralokasi.', v_sisa_pembayaran;
    END IF;

    PERFORM fn_refresh_saldo_simpanan_anggota(v_anggota_id, v_jenis_simpanan_id);

    RETURN QUERY
    SELECT
        v_transaksi_id,
        v_total_tagihan_teralokasi,
        v_total_nominal_teralokasi;
END;
$$;
