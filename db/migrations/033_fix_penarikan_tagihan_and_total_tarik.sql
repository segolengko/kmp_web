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
                WHEN js.model_pencatatan = 'TAGIHAN'
                    THEN COALESCE(alok.total_alokasi, 0) - COALESCE(trx.total_tarik_non_titipan, 0)
                ELSE COALESCE(trx.total_setor, 0) - COALESCE(trx.total_tarik, 0)
            END,
            0
        ) AS saldo_terbentuk,
        CASE
            WHEN js.kode = 'SPN' THEN GREATEST(
                CASE
                    WHEN js.model_pencatatan = 'TAGIHAN'
                        THEN COALESCE(alok.total_alokasi, 0) - COALESCE(trx.total_tarik_non_titipan, 0)
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
        COALESCE(trx.total_tarik, 0) AS total_tarik,
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
            ) AS total_tarik,
            SUM(
                CASE
                    WHEN ts.tipe_transaksi IN ('TARIK', 'KOREKSI_KELUAR')
                    THEN GREATEST(ts.nominal - COALESCE(rt.total_refund_titipan, 0), 0)
                    ELSE 0
                END
            ) AS total_tarik_non_titipan
        FROM transaksi_simpanan ts
        LEFT JOIN (
            SELECT
                mts.referensi_transaksi_simpanan_id AS transaksi_simpanan_id,
                SUM(mts.nominal) AS total_refund_titipan
            FROM mutasi_titipan_simpanan mts
            WHERE mts.tipe_mutasi = 'REFUND'
              AND mts.referensi_transaksi_simpanan_id IS NOT NULL
            GROUP BY mts.referensi_transaksi_simpanan_id
        ) rt
            ON rt.transaksi_simpanan_id = ts.id
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
    v_kode_simpanan VARCHAR(30);
    v_model_pencatatan VARCHAR(30);
    v_saldo_titipan NUMERIC(18, 2) := 0;
    v_saldo_terbentuk NUMERIC(18, 2) := 0;
    v_nominal_refund_titipan NUMERIC(18, 2) := 0;
    v_nominal_tarik_saldo NUMERIC(18, 2) := 0;
    v_no_mutasi VARCHAR(50);
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

        PERFORM fn_refresh_saldo_simpanan_anggota(v_anggota_id, v_jenis_simpanan_id);
        PERFORM fn_refresh_titipan_simpanan_anggota(v_anggota_id, v_jenis_simpanan_id);

        SELECT
            js.kode,
            js.model_pencatatan
        INTO
            v_kode_simpanan,
            v_model_pencatatan
        FROM jenis_simpanan js
        WHERE js.id = v_jenis_simpanan_id;

        SELECT COALESCE(ssa.saldo_terbentuk, 0)
        INTO v_saldo_terbentuk
        FROM saldo_simpanan_anggota ssa
        WHERE ssa.anggota_id = v_anggota_id
          AND ssa.jenis_simpanan_id = v_jenis_simpanan_id;

        SELECT COALESCE(tsa.saldo_titipan, 0)
        INTO v_saldo_titipan
        FROM titipan_simpanan_anggota tsa
        WHERE tsa.anggota_id = v_anggota_id
          AND tsa.jenis_simpanan_id = v_jenis_simpanan_id;

        IF v_model_pencatatan = 'TAGIHAN' THEN
            v_nominal_refund_titipan := LEAST(v_nominal_disetujui_final, COALESCE(v_saldo_titipan, 0));
            v_nominal_tarik_saldo := v_nominal_disetujui_final - v_nominal_refund_titipan;

            IF v_nominal_tarik_saldo > COALESCE(v_saldo_terbentuk, 0) THEN
                RAISE EXCEPTION
                    'Nominal penarikan % melebihi saldo simpanan yang tersedia (% saldo + % titipan).',
                    v_nominal_disetujui_final,
                    COALESCE(v_saldo_terbentuk, 0),
                    COALESCE(v_saldo_titipan, 0);
            END IF;
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

        IF v_nominal_refund_titipan > 0 THEN
            v_no_mutasi := FORMAT(
                'TTP-%s-REFUND-%s-%s-%s',
                COALESCE(v_kode_simpanan, 'UNK'),
                TO_CHAR(p_tanggal_proses, 'YYYYMMDD'),
                LPAD(v_anggota_id::TEXT, 6, '0'),
                TO_CHAR(CLOCK_TIMESTAMP(), 'HH24MISSMS')
            );

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
                v_no_mutasi,
                p_tanggal_proses,
                v_anggota_id,
                v_jenis_simpanan_id,
                'REFUND',
                v_nominal_refund_titipan,
                v_transaksi_id,
                FORMAT('Refund titipan untuk realisasi penarikan simpanan %s.', p_no_penarikan),
                p_diproses_oleh
            );
        END IF;

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
        PERFORM fn_refresh_titipan_simpanan_anggota(v_anggota_id, v_jenis_simpanan_id);
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
