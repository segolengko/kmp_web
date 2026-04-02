CREATE OR REPLACE FUNCTION fn_proses_anggota_keluar_lengkap(
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
    total_bersih_pengembalian NUMERIC(18, 2),
    total_draft_terbentuk INTEGER,
    total_nominal_pengajuan NUMERIC(18, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_anggota_id BIGINT;
    v_riwayat_id BIGINT;
    v_total_simpanan_dapat_ditarik NUMERIC(18, 2) := 0;
    v_total_tagihan_terbuka NUMERIC(18, 2) := 0;
    v_total_bersih_pengembalian NUMERIC(18, 2) := 0;
    v_total_draft_terbentuk INTEGER := 0;
    v_total_nominal_pengajuan NUMERIC(18, 2) := 0;
BEGIN
    SELECT
        p.anggota_id,
        p.riwayat_id,
        p.total_simpanan_dapat_ditarik,
        p.total_tagihan_terbuka,
        p.total_bersih_pengembalian
    INTO
        v_anggota_id,
        v_riwayat_id,
        v_total_simpanan_dapat_ditarik,
        v_total_tagihan_terbuka,
        v_total_bersih_pengembalian
    FROM fn_proses_anggota_keluar(
        p_no_anggota,
        p_tanggal_keluar,
        p_alasan_keluar,
        p_keterangan,
        p_dibuat_oleh
    ) p;

    SELECT
        d.total_draft_terbentuk,
        d.total_nominal_pengajuan
    INTO
        v_total_draft_terbentuk,
        v_total_nominal_pengajuan
    FROM fn_buat_draft_penarikan_keluar(
        p_no_anggota,
        p_tanggal_keluar,
        COALESCE(p_alasan_keluar, 'Draft penarikan otomatis karena anggota keluar.'),
        p_keterangan,
        p_dibuat_oleh
    ) d;

    RETURN QUERY
    SELECT
        v_anggota_id,
        v_riwayat_id,
        v_total_simpanan_dapat_ditarik,
        v_total_tagihan_terbuka,
        v_total_bersih_pengembalian,
        v_total_draft_terbentuk,
        v_total_nominal_pengajuan;
END;
$$;
