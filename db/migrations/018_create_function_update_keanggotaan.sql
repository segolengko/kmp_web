CREATE OR REPLACE FUNCTION fn_update_keanggotaan_anggota(
    p_no_anggota VARCHAR(30),
    p_jenis_anggota_baru VARCHAR(20) DEFAULT NULL,
    p_status_anggota_baru VARCHAR(20) DEFAULT NULL,
    p_tanggal_berlaku DATE DEFAULT CURRENT_DATE,
    p_tanggal_keluar_koperasi DATE DEFAULT NULL,
    p_alasan_perubahan VARCHAR(255) DEFAULT NULL,
    p_keterangan TEXT DEFAULT NULL,
    p_dibuat_oleh VARCHAR(100) DEFAULT 'system'
)
RETURNS TABLE (
    anggota_id BIGINT,
    riwayat_id BIGINT,
    jenis_anggota_lama VARCHAR(20),
    jenis_anggota_baru VARCHAR(20),
    status_anggota_lama VARCHAR(20),
    status_anggota_baru VARCHAR(20)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_anggota_id BIGINT;
    v_jenis_anggota_lama VARCHAR(20);
    v_status_anggota_lama VARCHAR(20);
    v_jenis_anggota_final VARCHAR(20);
    v_status_anggota_final VARCHAR(20);
    v_tanggal_keluar_final DATE;
    v_riwayat_id BIGINT;
BEGIN
    SELECT
        a.id,
        a.jenis_anggota,
        a.status_anggota
    INTO
        v_anggota_id,
        v_jenis_anggota_lama,
        v_status_anggota_lama
    FROM anggota a
    WHERE a.no_anggota = p_no_anggota;

    IF v_anggota_id IS NULL THEN
        RAISE EXCEPTION 'Anggota dengan no_anggota % tidak ditemukan.', p_no_anggota;
    END IF;

    v_jenis_anggota_final := COALESCE(p_jenis_anggota_baru, v_jenis_anggota_lama);
    v_status_anggota_final := COALESCE(p_status_anggota_baru, v_status_anggota_lama);

    IF v_jenis_anggota_final NOT IN ('BIASA', 'LUAR_BIASA') THEN
        RAISE EXCEPTION 'Jenis anggota baru % tidak valid.', v_jenis_anggota_final;
    END IF;

    IF v_status_anggota_final NOT IN ('AKTIF', 'PASIF', 'KELUAR') THEN
        RAISE EXCEPTION 'Status anggota baru % tidak valid.', v_status_anggota_final;
    END IF;

    IF v_jenis_anggota_final = v_jenis_anggota_lama
       AND v_status_anggota_final = v_status_anggota_lama
       AND p_alasan_perubahan IS NULL
       AND p_keterangan IS NULL
       AND p_tanggal_keluar_koperasi IS NULL THEN
        RAISE EXCEPTION 'Tidak ada perubahan keanggotaan yang dapat diproses untuk anggota %.', p_no_anggota;
    END IF;

    v_tanggal_keluar_final := CASE
        WHEN v_status_anggota_final = 'KELUAR' THEN COALESCE(p_tanggal_keluar_koperasi, p_tanggal_berlaku)
        ELSE NULL
    END;

    UPDATE anggota
    SET
        jenis_anggota = v_jenis_anggota_final,
        status_anggota = v_status_anggota_final,
        aktif = CASE WHEN v_status_anggota_final = 'AKTIF' THEN TRUE ELSE FALSE END,
        tanggal_keluar_koperasi = v_tanggal_keluar_final,
        tanggal_perubahan_status_terakhir = p_tanggal_berlaku,
        alasan_keluar_koperasi = CASE
            WHEN v_status_anggota_final = 'KELUAR' THEN p_alasan_perubahan
            ELSE NULL
        END,
        keterangan_status_anggota = p_keterangan,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_anggota_id;

    INSERT INTO riwayat_keanggotaan (
        anggota_id,
        tanggal_perubahan,
        jenis_anggota_lama,
        jenis_anggota_baru,
        status_anggota_lama,
        status_anggota_baru,
        tanggal_berlaku,
        alasan_perubahan,
        keterangan,
        dibuat_oleh
    )
    VALUES (
        v_anggota_id,
        CURRENT_DATE,
        v_jenis_anggota_lama,
        v_jenis_anggota_final,
        v_status_anggota_lama,
        v_status_anggota_final,
        p_tanggal_berlaku,
        p_alasan_perubahan,
        p_keterangan,
        p_dibuat_oleh
    )
    RETURNING id INTO v_riwayat_id;

    RETURN QUERY
    SELECT
        v_anggota_id,
        v_riwayat_id,
        v_jenis_anggota_lama,
        v_jenis_anggota_final,
        v_status_anggota_lama,
        v_status_anggota_final;
END;
$$;
