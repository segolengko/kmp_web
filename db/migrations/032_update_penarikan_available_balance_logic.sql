CREATE OR REPLACE FUNCTION fn_buat_draft_penarikan_keluar(
    p_no_anggota VARCHAR(30),
    p_tanggal_pengajuan DATE DEFAULT CURRENT_DATE,
    p_alasan_penarikan TEXT DEFAULT NULL,
    p_catatan TEXT DEFAULT NULL,
    p_diajukan_oleh VARCHAR(100) DEFAULT 'system'
)
RETURNS TABLE (
    anggota_id BIGINT,
    total_draft_terbentuk INTEGER,
    total_nominal_pengajuan NUMERIC(18, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_anggota_id BIGINT;
    v_total_draft_terbentuk INTEGER := 0;
    v_total_nominal_pengajuan NUMERIC(18, 2) := 0;
BEGIN
    PERFORM fn_refresh_saldo_simpanan_anggota(NULL, NULL);
    PERFORM fn_refresh_titipan_simpanan_anggota(NULL, NULL);

    SELECT a.id
    INTO v_anggota_id
    FROM anggota a
    WHERE a.no_anggota = p_no_anggota;

    IF v_anggota_id IS NULL THEN
        RAISE EXCEPTION 'Anggota dengan no_anggota % tidak ditemukan.', p_no_anggota;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM anggota a
        WHERE a.id = v_anggota_id
          AND a.status_anggota = 'KELUAR'
    ) THEN
        RAISE EXCEPTION 'Draft penarikan keluar hanya dapat dibuat untuk anggota yang berstatus KELUAR.';
    END IF;

    WITH kandidat AS (
        SELECT
            ssa.anggota_id,
            ssa.jenis_simpanan_id,
            CASE
                WHEN js.kategori = 'PENYERTAAN' THEN 0
                WHEN js.kode = 'SS' THEN COALESCE(ssa.saldo_tersedia, 0)
                WHEN js.model_pencatatan = 'TAGIHAN' THEN COALESCE(ssa.saldo_terbentuk, 0) + COALESCE(tsa.saldo_titipan, 0)
                ELSE COALESCE(ssa.saldo_terbentuk, 0)
            END AS nominal_pengajuan
        FROM saldo_simpanan_anggota ssa
        JOIN jenis_simpanan js ON js.id = ssa.jenis_simpanan_id
        LEFT JOIN titipan_simpanan_anggota tsa
          ON tsa.anggota_id = ssa.anggota_id
         AND tsa.jenis_simpanan_id = ssa.jenis_simpanan_id
        WHERE ssa.anggota_id = v_anggota_id
          AND js.kategori <> 'PENYERTAAN'
          AND CASE
                WHEN js.kode = 'SS' THEN COALESCE(ssa.saldo_tersedia, 0)
                WHEN js.model_pencatatan = 'TAGIHAN' THEN COALESCE(ssa.saldo_terbentuk, 0) + COALESCE(tsa.saldo_titipan, 0)
                ELSE COALESCE(ssa.saldo_terbentuk, 0)
              END > 0
    ),
    insert_penarikan AS (
        INSERT INTO penarikan_simpanan (
            no_penarikan,
            anggota_id,
            jenis_simpanan_id,
            tanggal_pengajuan,
            nominal_pengajuan,
            status_penarikan,
            alasan_penarikan,
            catatan,
            diajukan_oleh
        )
        SELECT
            FORMAT(
                'PNR-%s-%s-%s',
                LPAD(k.anggota_id::TEXT, 6, '0'),
                LPAD(k.jenis_simpanan_id::TEXT, 4, '0'),
                TO_CHAR(CLOCK_TIMESTAMP(), 'YYYYMMDDHH24MISSMS')
            ),
            k.anggota_id,
            k.jenis_simpanan_id,
            p_tanggal_pengajuan,
            k.nominal_pengajuan,
            'DIAJUKAN',
            COALESCE(p_alasan_penarikan, 'Draft penarikan simpanan karena anggota keluar.'),
            p_catatan,
            p_diajukan_oleh
        FROM kandidat k
        WHERE NOT EXISTS (
            SELECT 1
            FROM penarikan_simpanan ps
            WHERE ps.anggota_id = k.anggota_id
              AND ps.jenis_simpanan_id = k.jenis_simpanan_id
              AND ps.status_penarikan IN ('DIAJUKAN', 'DISETUJUI')
        )
        RETURNING nominal_pengajuan
    )
    SELECT
        COUNT(*),
        COALESCE(SUM(ip.nominal_pengajuan), 0)
    INTO
        v_total_draft_terbentuk,
        v_total_nominal_pengajuan
    FROM insert_penarikan ip;

    RETURN QUERY
    SELECT
        v_anggota_id,
        v_total_draft_terbentuk,
        v_total_nominal_pengajuan;
END;
$$;


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
    PERFORM fn_refresh_titipan_simpanan_anggota(NULL, NULL);

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
                    WHEN js.kategori = 'PENYERTAAN' THEN 0
                    WHEN js.kode = 'SS' THEN COALESCE(ssa.saldo_tersedia, 0)
                    WHEN js.model_pencatatan = 'TAGIHAN' THEN COALESCE(ssa.saldo_terbentuk, 0) + COALESCE(tsa.saldo_titipan, 0)
                    ELSE COALESCE(ssa.saldo_terbentuk, 0)
                END
            ),
            0
        )
    INTO v_total_simpanan_dapat_ditarik
    FROM saldo_simpanan_anggota ssa
    JOIN jenis_simpanan js ON js.id = ssa.jenis_simpanan_id
    LEFT JOIN titipan_simpanan_anggota tsa
      ON tsa.anggota_id = ssa.anggota_id
     AND tsa.jenis_simpanan_id = ssa.jenis_simpanan_id
    WHERE ssa.anggota_id = v_anggota_id
      AND js.kategori <> 'PENYERTAAN';

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
