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
                WHEN js.kode = 'SS' THEN ssa.saldo_tersedia
                ELSE ssa.saldo_terbentuk
            END AS nominal_pengajuan
        FROM saldo_simpanan_anggota ssa
        JOIN jenis_simpanan js ON js.id = ssa.jenis_simpanan_id
        WHERE ssa.anggota_id = v_anggota_id
          AND js.bisa_ditarik = TRUE
          AND CASE
                WHEN js.kode = 'SS' THEN ssa.saldo_tersedia
                ELSE ssa.saldo_terbentuk
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
