CREATE TABLE IF NOT EXISTS saldo_awal_simpanan_anggota (
    id BIGSERIAL PRIMARY KEY,
    anggota_id BIGINT NOT NULL REFERENCES anggota (id),
    jenis_simpanan_id BIGINT NOT NULL REFERENCES jenis_simpanan (id),
    tanggal_saldo_awal DATE NOT NULL DEFAULT CURRENT_DATE,
    saldo_terbentuk_awal NUMERIC(18, 2) NOT NULL DEFAULT 0,
    saldo_titipan_awal NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_setor_awal NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_tarik_awal NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_tagihan_awal NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_tunggakan_awal NUMERIC(18, 2) NOT NULL DEFAULT 0,
    catatan TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_saldo_awal_simpanan_anggota UNIQUE (anggota_id, jenis_simpanan_id),
    CONSTRAINT ck_saldo_awal_simpanan_anggota_saldo_terbentuk
        CHECK (saldo_terbentuk_awal >= 0),
    CONSTRAINT ck_saldo_awal_simpanan_anggota_saldo_titipan
        CHECK (saldo_titipan_awal >= 0),
    CONSTRAINT ck_saldo_awal_simpanan_anggota_total_setor
        CHECK (total_setor_awal >= 0),
    CONSTRAINT ck_saldo_awal_simpanan_anggota_total_tarik
        CHECK (total_tarik_awal >= 0),
    CONSTRAINT ck_saldo_awal_simpanan_anggota_total_tagihan
        CHECK (total_tagihan_awal >= 0),
    CONSTRAINT ck_saldo_awal_simpanan_anggota_total_tunggakan
        CHECK (total_tunggakan_awal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_saldo_awal_simpanan_anggota_anggota
    ON saldo_awal_simpanan_anggota (anggota_id);

CREATE INDEX IF NOT EXISTS idx_saldo_awal_simpanan_anggota_jenis
    ON saldo_awal_simpanan_anggota (jenis_simpanan_id);


CREATE OR REPLACE FUNCTION fn_refresh_titipan_simpanan_anggota(
    p_anggota_id BIGINT DEFAULT NULL,
    p_jenis_simpanan_id BIGINT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_affected_rows INTEGER;
BEGIN
    INSERT INTO titipan_simpanan_anggota (
        anggota_id,
        jenis_simpanan_id,
        saldo_titipan,
        terakhir_dihitung_at,
        updated_at
    )
    SELECT
        a.id AS anggota_id,
        js.id AS jenis_simpanan_id,
        GREATEST(
            COALESCE(sa.saldo_titipan_awal, 0)
            + COALESCE(mutasi.total_masuk, 0)
            - COALESCE(mutasi.total_keluar, 0),
            0
        ) AS saldo_titipan,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM anggota a
    CROSS JOIN jenis_simpanan js
    LEFT JOIN (
        SELECT
            saa.anggota_id,
            saa.jenis_simpanan_id,
            SUM(saa.saldo_titipan_awal) AS saldo_titipan_awal
        FROM saldo_awal_simpanan_anggota saa
        GROUP BY saa.anggota_id, saa.jenis_simpanan_id
    ) sa
        ON sa.anggota_id = a.id
       AND sa.jenis_simpanan_id = js.id
    LEFT JOIN (
        SELECT
            mts.anggota_id,
            mts.jenis_simpanan_id,
            SUM(
                CASE
                    WHEN mts.tipe_mutasi IN ('MASUK', 'KOREKSI_MASUK') THEN mts.nominal
                    ELSE 0
                END
            ) AS total_masuk,
            SUM(
                CASE
                    WHEN mts.tipe_mutasi IN ('PAKAI', 'KOREKSI_KELUAR', 'REFUND') THEN mts.nominal
                    ELSE 0
                END
            ) AS total_keluar
        FROM mutasi_titipan_simpanan mts
        GROUP BY mts.anggota_id, mts.jenis_simpanan_id
    ) mutasi
        ON mutasi.anggota_id = a.id
       AND mutasi.jenis_simpanan_id = js.id
    WHERE (p_anggota_id IS NULL OR a.id = p_anggota_id)
      AND (p_jenis_simpanan_id IS NULL OR js.id = p_jenis_simpanan_id)
    ON CONFLICT (anggota_id, jenis_simpanan_id)
    DO UPDATE SET
        saldo_titipan = EXCLUDED.saldo_titipan,
        terakhir_dihitung_at = EXCLUDED.terakhir_dihitung_at,
        updated_at = CURRENT_TIMESTAMP;

    GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
    RETURN v_affected_rows;
END;
$$;


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
                    THEN COALESCE(sa.saldo_terbentuk_awal, 0)
                         + COALESCE(alok.total_alokasi, 0)
                         - COALESCE(trx.total_tarik_non_titipan, 0)
                ELSE COALESCE(sa.saldo_terbentuk_awal, 0)
                     + COALESCE(trx.total_setor, 0)
                     - COALESCE(trx.total_tarik, 0)
            END,
            0
        ) AS saldo_terbentuk,
        CASE
            WHEN js.kode = 'SPN' THEN GREATEST(
                CASE
                    WHEN js.model_pencatatan = 'TAGIHAN'
                        THEN COALESCE(sa.saldo_terbentuk_awal, 0)
                             + COALESCE(alok.total_alokasi, 0)
                             - COALESCE(trx.total_tarik_non_titipan, 0)
                    ELSE COALESCE(sa.saldo_terbentuk_awal, 0)
                         + COALESCE(trx.total_setor, 0)
                         - COALESCE(trx.total_tarik, 0)
                END,
                0
            )
            ELSE 0
        END AS saldo_ditahan,
        CASE
            WHEN js.kode = 'SS' THEN GREATEST(
                COALESCE(sa.saldo_terbentuk_awal, 0)
                + COALESCE(trx.total_setor, 0)
                - COALESCE(trx.total_tarik, 0),
                0
            )
            ELSE 0
        END AS saldo_tersedia,
        CASE
            WHEN js.model_pencatatan = 'TAGIHAN'
                THEN COALESCE(sa.total_setor_awal, 0) + COALESCE(alok.total_alokasi, 0)
            ELSE COALESCE(sa.total_setor_awal, 0) + COALESCE(trx.total_setor, 0)
        END AS total_setor,
        COALESCE(sa.total_tarik_awal, 0) + COALESCE(trx.total_tarik, 0) AS total_tarik,
        COALESCE(sa.total_tagihan_awal, 0) + COALESCE(tag.total_tagihan, 0) AS total_tagihan,
        COALESCE(sa.total_tunggakan_awal, 0) + COALESCE(tag.total_tunggakan, 0) AS total_tunggakan,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM anggota a
    CROSS JOIN jenis_simpanan js
    LEFT JOIN (
        SELECT
            saa.anggota_id,
            saa.jenis_simpanan_id,
            SUM(saa.saldo_terbentuk_awal) AS saldo_terbentuk_awal,
            SUM(saa.total_setor_awal) AS total_setor_awal,
            SUM(saa.total_tarik_awal) AS total_tarik_awal,
            SUM(saa.total_tagihan_awal) AS total_tagihan_awal,
            SUM(saa.total_tunggakan_awal) AS total_tunggakan_awal
        FROM saldo_awal_simpanan_anggota saa
        GROUP BY saa.anggota_id, saa.jenis_simpanan_id
    ) sa
        ON sa.anggota_id = a.id
       AND sa.jenis_simpanan_id = js.id
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
