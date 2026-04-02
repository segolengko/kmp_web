CREATE OR REPLACE FUNCTION fn_proses_anggota_keluar(
    p_no_anggota VARCHAR(30),
    p_tanggal_keluar DATE DEFAULT CURRENT_DATE,
    p_alasan_keluar VARCHAR(255) DEFAULT NULL,
    p_keterangan TEXT DEFAULT NULL,
    p_dibuat_oleh VARCHAR(100) DEFAULT 'system'
)
RETURNS TABLE (
    anggota_id BIGINT,
    riwayat_id BIGINT,
    total_simpanan_dapat_ditarik NUMERIC(18, 2),
    total_tagihan_terbuka NUMERIC(18, 2),
    total_bersih_pengembalian NUMERIC(18, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_anggota_id BIGINT;
    v_riwayat_id BIGINT;
    v_total_simpanan_dapat_ditarik NUMERIC(18, 2) := 0;
    v_total_tagihan_terbuka NUMERIC(18, 2) := 0;
    v_total_bersih_pengembalian NUMERIC(18, 2) := 0;
BEGIN
    PERFORM fn_refresh_saldo_simpanan_anggota(NULL, NULL);

    SELECT
        u.anggota_id,
        u.riwayat_id
    INTO
        v_anggota_id,
        v_riwayat_id
    FROM fn_update_keanggotaan_anggota(
        p_no_anggota,
        NULL,
        'KELUAR',
        p_tanggal_keluar,
        p_tanggal_keluar,
        p_alasan_keluar,
        p_keterangan,
        p_dibuat_oleh
    ) u;

    IF v_anggota_id IS NULL THEN
        RAISE EXCEPTION 'Proses keluar anggota % gagal diproses.', p_no_anggota;
    END IF;

    SELECT
        COALESCE(
            SUM(
                CASE
                    WHEN js.kode = 'SS' THEN ssa.saldo_tersedia
                    ELSE ssa.saldo_terbentuk
                END
            ),
            0
        )
    INTO v_total_simpanan_dapat_ditarik
    FROM saldo_simpanan_anggota ssa
    JOIN jenis_simpanan js ON js.id = ssa.jenis_simpanan_id
    WHERE ssa.anggota_id = v_anggota_id
      AND js.bisa_ditarik = TRUE;

    SELECT
        COALESCE(SUM(ts.nominal_tagihan - ts.nominal_terbayar), 0)
    INTO v_total_tagihan_terbuka
    FROM tagihan_simpanan ts
    WHERE ts.anggota_id = v_anggota_id
      AND ts.status_tagihan IN ('BELUM_BAYAR', 'SEBAGIAN');

    v_total_bersih_pengembalian := v_total_simpanan_dapat_ditarik - v_total_tagihan_terbuka;

    RETURN QUERY
    SELECT
        v_anggota_id,
        v_riwayat_id,
        v_total_simpanan_dapat_ditarik,
        v_total_tagihan_terbuka,
        v_total_bersih_pengembalian;
END;
$$;
