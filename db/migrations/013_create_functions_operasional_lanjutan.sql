CREATE OR REPLACE FUNCTION fn_buat_tagihan_awal_anggota(
    p_no_anggota VARCHAR(30),
    p_tanggal_tagihan DATE DEFAULT CURRENT_DATE,
    p_created_by VARCHAR(100) DEFAULT 'system'
)
RETURNS TABLE (
    anggota_id BIGINT,
    total_tagihan_terbentuk INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_anggota_id BIGINT;
    v_total_tagihan_terbentuk INTEGER := 0;
BEGIN
    SELECT a.id
    INTO v_anggota_id
    FROM anggota a
    WHERE a.no_anggota = p_no_anggota;

    IF v_anggota_id IS NULL THEN
        RAISE EXCEPTION 'Anggota dengan no_anggota % tidak ditemukan.', p_no_anggota;
    END IF;

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
        FORMAT('TG-%s-%s-%s', js.kode, TO_CHAR(p_tanggal_tagihan, 'YYYYMMDD'), LPAD(v_anggota_id::TEXT, 6, '0')),
        v_anggota_id,
        js.id,
        CASE
            WHEN js.kode = 'SP' THEN 'POKOK-AWAL'
            WHEN js.kode = 'SPN' THEN 'PENYERTAAN-AWAL'
        END,
        EXTRACT(YEAR FROM p_tanggal_tagihan)::SMALLINT,
        EXTRACT(MONTH FROM p_tanggal_tagihan)::SMALLINT,
        p_tanggal_tagihan,
        p_tanggal_tagihan,
        ps.nominal,
        0,
        'BELUM_BAYAR',
        FORMAT('Tagihan awal %s dibuat oleh %s.', js.nama, p_created_by)
    FROM jenis_simpanan js
    JOIN pengaturan_simpanan ps ON ps.jenis_simpanan_id = js.id
    WHERE js.kode IN ('SP', 'SPN')
      AND js.aktif = TRUE
      AND ps.aktif = TRUE
      AND p_tanggal_tagihan BETWEEN ps.berlaku_mulai AND COALESCE(ps.berlaku_sampai, DATE '2999-12-31')
      AND NOT EXISTS (
          SELECT 1
          FROM tagihan_simpanan ts
          WHERE ts.anggota_id = v_anggota_id
            AND ts.jenis_simpanan_id = js.id
            AND ts.periode_label = CASE
                WHEN js.kode = 'SP' THEN 'POKOK-AWAL'
                WHEN js.kode = 'SPN' THEN 'PENYERTAAN-AWAL'
            END
      );

    GET DIAGNOSTICS v_total_tagihan_terbentuk = ROW_COUNT;

    PERFORM fn_refresh_saldo_simpanan_anggota(v_anggota_id, NULL);

    RETURN QUERY
    SELECT v_anggota_id, v_total_tagihan_terbentuk;
END;
$$;


CREATE OR REPLACE FUNCTION fn_catat_transaksi_simpanan_langsung(
    p_no_anggota VARCHAR(30),
    p_kode_simpanan VARCHAR(30),
    p_tanggal_transaksi DATE,
    p_tipe_transaksi VARCHAR(20),
    p_nominal NUMERIC(18, 2),
    p_metode_bayar VARCHAR(20) DEFAULT 'TUNAI',
    p_keterangan TEXT DEFAULT NULL,
    p_created_by VARCHAR(100) DEFAULT 'system'
)
RETURNS TABLE (
    transaksi_id BIGINT,
    anggota_id BIGINT,
    jenis_simpanan_id BIGINT,
    tipe_transaksi VARCHAR(20),
    nominal NUMERIC(18, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_anggota_id BIGINT;
    v_jenis_simpanan_id BIGINT;
    v_model_pencatatan VARCHAR(20);
    v_bisa_ditarik BOOLEAN;
    v_suffix_transaksi TEXT;
    v_transaksi_id BIGINT;
    v_saldo_tersedia NUMERIC(18, 2);
BEGIN
    IF p_nominal IS NULL OR p_nominal <= 0 THEN
        RAISE EXCEPTION 'Nominal transaksi harus lebih besar dari 0.';
    END IF;

    IF p_tipe_transaksi NOT IN ('SETOR', 'TARIK', 'KOREKSI_MASUK', 'KOREKSI_KELUAR') THEN
        RAISE EXCEPTION 'Tipe transaksi % tidak valid.', p_tipe_transaksi;
    END IF;

    SELECT a.id
    INTO v_anggota_id
    FROM anggota a
    WHERE a.no_anggota = p_no_anggota;

    IF v_anggota_id IS NULL THEN
        RAISE EXCEPTION 'Anggota dengan no_anggota % tidak ditemukan.', p_no_anggota;
    END IF;

    SELECT js.id, js.model_pencatatan, js.bisa_ditarik
    INTO v_jenis_simpanan_id, v_model_pencatatan, v_bisa_ditarik
    FROM jenis_simpanan js
    WHERE js.kode = p_kode_simpanan
      AND js.aktif = TRUE;

    IF v_jenis_simpanan_id IS NULL THEN
        RAISE EXCEPTION 'Jenis simpanan dengan kode % tidak ditemukan atau tidak aktif.', p_kode_simpanan;
    END IF;

    IF v_model_pencatatan <> 'TRANSAKSI_LANGSUNG' THEN
        RAISE EXCEPTION 'Jenis simpanan % bukan tipe transaksi langsung.', p_kode_simpanan;
    END IF;

    IF p_tipe_transaksi IN ('TARIK', 'KOREKSI_KELUAR') THEN
        IF v_bisa_ditarik IS NOT TRUE THEN
            RAISE EXCEPTION 'Jenis simpanan % tidak dapat ditarik.', p_kode_simpanan;
        END IF;

        SELECT COALESCE(ssa.saldo_tersedia, 0)
        INTO v_saldo_tersedia
        FROM saldo_simpanan_anggota ssa
        WHERE ssa.anggota_id = v_anggota_id
          AND ssa.jenis_simpanan_id = v_jenis_simpanan_id;

        IF COALESCE(v_saldo_tersedia, 0) < p_nominal THEN
            RAISE EXCEPTION
                'Saldo tersedia % tidak cukup untuk transaksi % sebesar %.',
                COALESCE(v_saldo_tersedia, 0),
                p_tipe_transaksi,
                p_nominal;
        END IF;
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
        'TRANSAKSI_LANGSUNG',
        p_tipe_transaksi,
        p_metode_bayar,
        p_nominal,
        COALESCE(p_keterangan, FORMAT('Transaksi langsung simpanan %s.', p_kode_simpanan)),
        p_created_by
    )
    RETURNING id INTO v_transaksi_id;

    PERFORM fn_refresh_saldo_simpanan_anggota(v_anggota_id, v_jenis_simpanan_id);

    RETURN QUERY
    SELECT
        v_transaksi_id,
        v_anggota_id,
        v_jenis_simpanan_id,
        p_tipe_transaksi,
        p_nominal;
END;
$$;
