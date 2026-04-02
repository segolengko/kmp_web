CREATE OR REPLACE FUNCTION fn_batalkan_pembayaran_simpanan(
    p_no_transaksi VARCHAR(40),
    p_tanggal_batal DATE DEFAULT CURRENT_DATE,
    p_catatan TEXT DEFAULT NULL,
    p_dibatalkan_oleh VARCHAR(100) DEFAULT 'system'
)
RETURNS TABLE (
    transaksi_asal_id BIGINT,
    transaksi_pembatalan_id BIGINT,
    anggota_id BIGINT,
    jenis_simpanan_id BIGINT,
    total_tagihan_dikoreksi INTEGER,
    total_nominal_dikoreksi NUMERIC(18, 2),
    total_titipan_dikoreksi NUMERIC(18, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_transaksi_asal_id BIGINT;
    v_transaksi_pembatalan_id BIGINT;
    v_anggota_id BIGINT;
    v_jenis_simpanan_id BIGINT;
    v_model_transaksi VARCHAR(25);
    v_tipe_transaksi VARCHAR(20);
    v_metode_bayar VARCHAR(20);
    v_nominal_asal NUMERIC(18, 2);
    v_keterangan_asal TEXT;
    v_created_by VARCHAR(100);
    v_total_tagihan_dikoreksi INTEGER := 0;
    v_total_nominal_dikoreksi NUMERIC(18, 2) := 0;
    v_total_titipan_dikoreksi NUMERIC(18, 2) := 0;
    v_saldo_titipan NUMERIC(18, 2) := 0;
    v_kode_simpanan VARCHAR(30);
    v_suffix_transaksi TEXT;
    v_suffix_mutasi TEXT;
    v_row RECORD;
BEGIN
    SELECT
        ts.id,
        ts.anggota_id,
        ts.jenis_simpanan_id,
        ts.model_transaksi,
        ts.tipe_transaksi,
        ts.metode_bayar,
        ts.nominal,
        ts.keterangan,
        ts.created_by
    INTO
        v_transaksi_asal_id,
        v_anggota_id,
        v_jenis_simpanan_id,
        v_model_transaksi,
        v_tipe_transaksi,
        v_metode_bayar,
        v_nominal_asal,
        v_keterangan_asal,
        v_created_by
    FROM transaksi_simpanan ts
    WHERE ts.no_transaksi = p_no_transaksi
    FOR UPDATE;

    IF v_transaksi_asal_id IS NULL THEN
        RAISE EXCEPTION 'Transaksi pembayaran % tidak ditemukan.', p_no_transaksi;
    END IF;

    IF v_model_transaksi <> 'PEMBAYARAN_TAGIHAN' OR v_tipe_transaksi <> 'SETOR' THEN
        RAISE EXCEPTION 'Transaksi % bukan pembayaran tagihan manual yang bisa dibatalkan.', p_no_transaksi;
    END IF;

    IF COALESCE(v_keterangan_asal, '') ILIKE '%[DIBATALKAN%' THEN
        RAISE EXCEPTION 'Transaksi % sudah pernah dibatalkan.', p_no_transaksi;
    END IF;

    IF COALESCE(v_metode_bayar, '') = 'DEBET_SALDO'
       OR COALESCE(NULLIF(BTRIM(v_created_by), ''), 'system') = 'system'
       OR COALESCE(v_keterangan_asal, '') ILIKE 'Pelunasan otomatis%'
       OR COALESCE(v_keterangan_asal, '') ILIKE 'Auto alokasi titipan%' THEN
        RAISE EXCEPTION 'Transaksi % berasal dari proses otomatis dan tidak bisa dibatalkan dari page data.', p_no_transaksi;
    END IF;

    SELECT
        COUNT(*),
        COALESCE(SUM(aps.nominal_alokasi), 0)
    INTO
        v_total_tagihan_dikoreksi,
        v_total_nominal_dikoreksi
    FROM alokasi_pembayaran_simpanan aps
    WHERE aps.transaksi_simpanan_id = v_transaksi_asal_id;

    SELECT COALESCE(SUM(mts.nominal), 0)
    INTO v_total_titipan_dikoreksi
    FROM mutasi_titipan_simpanan mts
    WHERE mts.referensi_transaksi_simpanan_id = v_transaksi_asal_id
      AND mts.tipe_mutasi = 'MASUK';

    IF v_total_tagihan_dikoreksi = 0 AND v_total_titipan_dikoreksi = 0 THEN
        RAISE EXCEPTION 'Transaksi % tidak memiliki alokasi atau titipan yang bisa dikoreksi.', p_no_transaksi;
    END IF;

    IF v_total_titipan_dikoreksi > 0 THEN
        SELECT COALESCE(tsa.saldo_titipan, 0)
        INTO v_saldo_titipan
        FROM titipan_simpanan_anggota tsa
        WHERE tsa.anggota_id = v_anggota_id
          AND tsa.jenis_simpanan_id = v_jenis_simpanan_id;

        IF COALESCE(v_saldo_titipan, 0) < v_total_titipan_dikoreksi THEN
            RAISE EXCEPTION
                'Pembayaran % tidak bisa dibatalkan karena titipan hasil bayar sebesar % sudah terpakai. Saldo titipan tersisa %.',
                p_no_transaksi,
                v_total_titipan_dikoreksi,
                COALESCE(v_saldo_titipan, 0);
        END IF;
    END IF;

    SELECT js.kode
    INTO v_kode_simpanan
    FROM jenis_simpanan js
    WHERE js.id = v_jenis_simpanan_id;

    v_suffix_transaksi := TO_CHAR(CLOCK_TIMESTAMP(), 'YYYYMMDDHH24MISSMS');

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
            'TRX-BTL-%s-%s',
            LPAD(v_anggota_id::TEXT, 6, '0'),
            v_suffix_transaksi
        ),
        p_tanggal_batal,
        v_anggota_id,
        v_jenis_simpanan_id,
        'PEMBAYARAN_TAGIHAN',
        'KOREKSI_KELUAR',
        v_metode_bayar,
        v_nominal_asal,
        COALESCE(
            p_catatan,
            FORMAT('Pembatalan pembayaran simpanan %s untuk transaksi %s.', COALESCE(v_kode_simpanan, '-'), p_no_transaksi)
        ),
        p_dibatalkan_oleh
    )
    RETURNING id INTO v_transaksi_pembatalan_id;

    FOR v_row IN
        SELECT
            aps.tagihan_simpanan_id,
            aps.nominal_alokasi
        FROM alokasi_pembayaran_simpanan aps
        WHERE aps.transaksi_simpanan_id = v_transaksi_asal_id
        ORDER BY aps.id
    LOOP
        UPDATE tagihan_simpanan ts
        SET
            nominal_terbayar = GREATEST(ts.nominal_terbayar - v_row.nominal_alokasi, 0),
            status_tagihan = CASE
                WHEN GREATEST(ts.nominal_terbayar - v_row.nominal_alokasi, 0) >= ts.nominal_tagihan THEN 'LUNAS'
                WHEN GREATEST(ts.nominal_terbayar - v_row.nominal_alokasi, 0) > 0 THEN 'SEBAGIAN'
                ELSE 'BELUM_BAYAR'
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE ts.id = v_row.tagihan_simpanan_id;
    END LOOP;

    DELETE FROM alokasi_pembayaran_simpanan aps
    WHERE aps.transaksi_simpanan_id = v_transaksi_asal_id;

    IF v_total_titipan_dikoreksi > 0 THEN
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
                'TTP-%s-BATAL-%s-%s-%s',
                COALESCE(v_kode_simpanan, 'UNK'),
                TO_CHAR(p_tanggal_batal, 'YYYYMMDD'),
                LPAD(v_anggota_id::TEXT, 6, '0'),
                v_suffix_mutasi
            ),
            p_tanggal_batal,
            v_anggota_id,
            v_jenis_simpanan_id,
            'KOREKSI_KELUAR',
            v_total_titipan_dikoreksi,
            v_transaksi_pembatalan_id,
            COALESCE(
                p_catatan,
                FORMAT('Koreksi keluar titipan akibat pembatalan pembayaran %s.', p_no_transaksi)
            ),
            p_dibatalkan_oleh
        );
    END IF;

    UPDATE transaksi_simpanan ts
    SET
        keterangan = TRIM(
            BOTH
            FROM CONCAT(
                COALESCE(ts.keterangan, ''),
                CASE WHEN COALESCE(ts.keterangan, '') = '' THEN '' ELSE ' ' END,
                FORMAT('[DIBATALKAN %s oleh %s]', TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS'), p_dibatalkan_oleh)
            )
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE ts.id = v_transaksi_asal_id;

    PERFORM fn_refresh_saldo_simpanan_anggota(v_anggota_id, v_jenis_simpanan_id);
    PERFORM fn_refresh_titipan_simpanan_anggota(v_anggota_id, v_jenis_simpanan_id);

    RETURN QUERY
    SELECT
        v_transaksi_asal_id,
        v_transaksi_pembatalan_id,
        v_anggota_id,
        v_jenis_simpanan_id,
        v_total_tagihan_dikoreksi,
        v_total_nominal_dikoreksi,
        v_total_titipan_dikoreksi;
END;
$$;
