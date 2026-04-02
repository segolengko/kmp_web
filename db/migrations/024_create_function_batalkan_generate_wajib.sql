CREATE OR REPLACE FUNCTION fn_batalkan_generate_wajib(
    p_batch_id BIGINT,
    p_dibatalkan_oleh VARCHAR(100) DEFAULT 'system',
    p_catatan TEXT DEFAULT NULL
)
RETURNS TABLE (
    batch_id BIGINT,
    total_tagihan_dibatalkan INTEGER,
    total_transaksi_dihapus INTEGER,
    total_alokasi_dihapus INTEGER,
    status_batch VARCHAR(20)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_batch_id BIGINT;
    v_jenis_simpanan_id BIGINT;
    v_kode_simpanan VARCHAR(30);
    v_status_batch VARCHAR(20);
    v_total_tagihan_dibatalkan INTEGER := 0;
    v_total_transaksi_dihapus INTEGER := 0;
    v_total_alokasi_dihapus INTEGER := 0;
    v_total_transaksi_non_auto INTEGER := 0;
    v_total_tagihan_non_lunas_auto INTEGER := 0;
BEGIN
    SELECT
        b.id,
        b.jenis_simpanan_id,
        js.kode,
        b.status_batch
    INTO
        v_batch_id,
        v_jenis_simpanan_id,
        v_kode_simpanan,
        v_status_batch
    FROM batch_generate_tagihan_simpanan b
    JOIN jenis_simpanan js ON js.id = b.jenis_simpanan_id
    WHERE b.id = p_batch_id;

    IF v_batch_id IS NULL THEN
        RAISE EXCEPTION 'Batch generate dengan id % tidak ditemukan.', p_batch_id;
    END IF;

    IF v_kode_simpanan <> 'SW' THEN
        RAISE EXCEPTION 'Pembatalan batch hanya diizinkan untuk simpanan wajib (SW).';
    END IF;

    IF v_status_batch = 'DIBATALKAN' THEN
        RAISE EXCEPTION 'Batch % sudah berstatus DIBATALKAN.', p_batch_id;
    END IF;

    SELECT COUNT(*)
    INTO v_total_transaksi_non_auto
    FROM transaksi_simpanan trx
    JOIN alokasi_pembayaran_simpanan aps ON aps.transaksi_simpanan_id = trx.id
    JOIN tagihan_simpanan ts ON ts.id = aps.tagihan_simpanan_id
    WHERE ts.batch_generate_tagihan_simpanan_id = v_batch_id
      AND (
          trx.metode_bayar IS DISTINCT FROM 'POTONG_GAJI'
          OR trx.created_by IS NULL
          OR trx.model_transaksi <> 'PEMBAYARAN_TAGIHAN'
          OR trx.tipe_transaksi <> 'SETOR'
          OR trx.keterangan NOT ILIKE 'Pelunasan otomatis simpanan wajib bulanan%'
      );

    IF v_total_transaksi_non_auto > 0 THEN
        RAISE EXCEPTION
            'Batch % tidak dapat dibatalkan karena sudah mengandung pembayaran manual atau transaksi non otomatis.',
            p_batch_id;
    END IF;

    SELECT COUNT(*)
    INTO v_total_tagihan_non_lunas_auto
    FROM tagihan_simpanan ts
    WHERE ts.batch_generate_tagihan_simpanan_id = v_batch_id
      AND ts.status_tagihan IN ('SEBAGIAN', 'DIBATALKAN');

    IF v_total_tagihan_non_lunas_auto > 0 THEN
        RAISE EXCEPTION
            'Batch % tidak dapat dibatalkan karena ada tagihan dengan status parsial/dibatalkan yang perlu ditangani manual.',
            p_batch_id;
    END IF;

    WITH alokasi_target AS (
        SELECT aps.id
        FROM alokasi_pembayaran_simpanan aps
        JOIN tagihan_simpanan ts ON ts.id = aps.tagihan_simpanan_id
        WHERE ts.batch_generate_tagihan_simpanan_id = v_batch_id
    )
    DELETE FROM alokasi_pembayaran_simpanan aps
    WHERE aps.id IN (SELECT id FROM alokasi_target);

    GET DIAGNOSTICS v_total_alokasi_dihapus = ROW_COUNT;

    WITH transaksi_target AS (
        SELECT DISTINCT trx.id
        FROM transaksi_simpanan trx
        JOIN tagihan_simpanan ts
          ON ts.anggota_id = trx.anggota_id
         AND ts.jenis_simpanan_id = trx.jenis_simpanan_id
        WHERE ts.batch_generate_tagihan_simpanan_id = v_batch_id
          AND trx.model_transaksi = 'PEMBAYARAN_TAGIHAN'
          AND trx.tipe_transaksi = 'SETOR'
          AND trx.metode_bayar = 'POTONG_GAJI'
          AND trx.keterangan ILIKE 'Pelunasan otomatis simpanan wajib bulanan%'
    )
    DELETE FROM transaksi_simpanan trx
    WHERE trx.id IN (SELECT id FROM transaksi_target);

    GET DIAGNOSTICS v_total_transaksi_dihapus = ROW_COUNT;

    DELETE FROM tagihan_simpanan ts
    WHERE ts.batch_generate_tagihan_simpanan_id = v_batch_id;

    GET DIAGNOSTICS v_total_tagihan_dibatalkan = ROW_COUNT;

    UPDATE batch_generate_tagihan_simpanan
    SET
        total_anggota = 0,
        total_tagihan_terbentuk = 0,
        status_batch = 'DIBATALKAN',
        catatan = COALESCE(
            p_catatan,
            FORMAT(
                'Batch dibatalkan oleh %s. Tagihan dihapus: %s, transaksi otomatis dihapus: %s.',
                p_dibatalkan_oleh,
                v_total_tagihan_dibatalkan,
                v_total_transaksi_dihapus
            )
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_batch_id;

    PERFORM fn_refresh_saldo_simpanan_anggota(NULL, v_jenis_simpanan_id);

    RETURN QUERY
    SELECT
        v_batch_id,
        v_total_tagihan_dibatalkan,
        v_total_transaksi_dihapus,
        v_total_alokasi_dihapus,
        'DIBATALKAN'::VARCHAR(20);
END;
$$;
