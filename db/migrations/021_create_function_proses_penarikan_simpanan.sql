CREATE OR REPLACE FUNCTION fn_proses_penarikan_simpanan(
    p_no_penarikan VARCHAR(40),
    p_status_baru VARCHAR(20),
    p_tanggal_proses DATE DEFAULT CURRENT_DATE,
    p_nominal_disetujui NUMERIC(18, 2) DEFAULT NULL,
    p_catatan TEXT DEFAULT NULL,
    p_diproses_oleh VARCHAR(100) DEFAULT 'system'
)
RETURNS TABLE (
    penarikan_id BIGINT,
    transaksi_id BIGINT,
    status_lama VARCHAR(20),
    status_baru VARCHAR(20),
    nominal_pengajuan NUMERIC(18, 2),
    nominal_disetujui NUMERIC(18, 2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_penarikan_id BIGINT;
    v_anggota_id BIGINT;
    v_jenis_simpanan_id BIGINT;
    v_status_lama VARCHAR(20);
    v_nominal_pengajuan NUMERIC(18, 2);
    v_nominal_disetujui_final NUMERIC(18, 2);
    v_no_transaksi VARCHAR(40);
    v_transaksi_id BIGINT;
BEGIN
    SELECT
        ps.id,
        ps.anggota_id,
        ps.jenis_simpanan_id,
        ps.status_penarikan,
        ps.nominal_pengajuan,
        ps.nominal_disetujui
    INTO
        v_penarikan_id,
        v_anggota_id,
        v_jenis_simpanan_id,
        v_status_lama,
        v_nominal_pengajuan,
        v_nominal_disetujui_final
    FROM penarikan_simpanan ps
    WHERE ps.no_penarikan = p_no_penarikan;

    IF v_penarikan_id IS NULL THEN
        RAISE EXCEPTION 'Penarikan dengan no_penarikan % tidak ditemukan.', p_no_penarikan;
    END IF;

    IF p_status_baru NOT IN ('DISETUJUI', 'DITOLAK', 'DIBATALKAN', 'DIREALISASIKAN') THEN
        RAISE EXCEPTION 'Status penarikan baru % tidak valid.', p_status_baru;
    END IF;

    IF p_status_baru = 'DISETUJUI' AND v_status_lama <> 'DIAJUKAN' THEN
        RAISE EXCEPTION 'Penarikan % hanya bisa disetujui dari status DIAJUKAN.', p_no_penarikan;
    END IF;

    IF p_status_baru IN ('DITOLAK', 'DIBATALKAN') AND v_status_lama NOT IN ('DIAJUKAN', 'DISETUJUI') THEN
        RAISE EXCEPTION 'Penarikan % hanya bisa ditolak/dibatalkan dari status DIAJUKAN atau DISETUJUI.', p_no_penarikan;
    END IF;

    IF p_status_baru = 'DIREALISASIKAN' AND v_status_lama <> 'DISETUJUI' THEN
        RAISE EXCEPTION 'Penarikan % hanya bisa direalisasikan dari status DISETUJUI.', p_no_penarikan;
    END IF;

    IF p_status_baru = 'DISETUJUI' THEN
        v_nominal_disetujui_final := COALESCE(p_nominal_disetujui, v_nominal_pengajuan);

        IF v_nominal_disetujui_final <= 0 OR v_nominal_disetujui_final > v_nominal_pengajuan THEN
            RAISE EXCEPTION 'Nominal disetujui % tidak valid untuk penarikan %.', v_nominal_disetujui_final, p_no_penarikan;
        END IF;

        UPDATE penarikan_simpanan
        SET
            nominal_disetujui = v_nominal_disetujui_final,
            status_penarikan = 'DISETUJUI',
            tanggal_persetujuan = p_tanggal_proses,
            catatan = COALESCE(p_catatan, catatan),
            disetujui_oleh = p_diproses_oleh,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_penarikan_id;
    ELSIF p_status_baru IN ('DITOLAK', 'DIBATALKAN') THEN
        UPDATE penarikan_simpanan
        SET
            status_penarikan = p_status_baru,
            catatan = COALESCE(p_catatan, catatan),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_penarikan_id;
    ELSIF p_status_baru = 'DIREALISASIKAN' THEN
        v_nominal_disetujui_final := COALESCE(v_nominal_disetujui_final, p_nominal_disetujui, v_nominal_pengajuan);

        IF v_nominal_disetujui_final IS NULL OR v_nominal_disetujui_final <= 0 THEN
            RAISE EXCEPTION 'Nominal disetujui untuk penarikan % belum tersedia.', p_no_penarikan;
        END IF;

        v_no_transaksi := FORMAT(
            'TRX-KELUAR-%s-%s',
            LPAD(v_anggota_id::TEXT, 6, '0'),
            TO_CHAR(CLOCK_TIMESTAMP(), 'YYYYMMDDHH24MISSMS')
        );

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
            v_no_transaksi,
            p_tanggal_proses,
            v_anggota_id,
            v_jenis_simpanan_id,
            'TRANSAKSI_LANGSUNG',
            'TARIK',
            'TRANSFER',
            v_nominal_disetujui_final,
            FORMAT('Realisasi penarikan simpanan %s.', p_no_penarikan),
            p_diproses_oleh
        )
        RETURNING id INTO v_transaksi_id;

        UPDATE penarikan_simpanan
        SET
            nominal_disetujui = v_nominal_disetujui_final,
            status_penarikan = 'DIREALISASIKAN',
            tanggal_realisasi = p_tanggal_proses,
            catatan = COALESCE(p_catatan, catatan),
            direalisasi_oleh = p_diproses_oleh,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_penarikan_id;

        PERFORM fn_refresh_saldo_simpanan_anggota(v_anggota_id, v_jenis_simpanan_id);
    END IF;

    RETURN QUERY
    SELECT
        v_penarikan_id,
        v_transaksi_id,
        v_status_lama,
        p_status_baru,
        v_nominal_pengajuan,
        COALESCE(v_nominal_disetujui_final, p_nominal_disetujui, v_nominal_pengajuan);
END;
$$;
