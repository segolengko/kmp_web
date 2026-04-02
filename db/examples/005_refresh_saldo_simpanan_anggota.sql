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
    GREATEST(COALESCE(trx.total_setor, 0) - COALESCE(trx.total_tarik, 0), 0) AS saldo_terbentuk,
    CASE
        WHEN js.kode = 'SPN' THEN GREATEST(COALESCE(trx.total_setor, 0) - COALESCE(trx.total_tarik, 0), 0)
        ELSE 0
    END AS saldo_ditahan,
    CASE
        WHEN js.kode = 'SS' THEN GREATEST(COALESCE(trx.total_setor, 0) - COALESCE(trx.total_tarik, 0), 0)
        ELSE 0
    END AS saldo_tersedia,
    COALESCE(trx.total_setor, 0) AS total_setor,
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
                WHEN ts.tipe_transaksi IN ('SETOR', 'KOREKSI_MASUK') THEN ts.nominal
                ELSE 0
            END
        ) AS total_setor,
        SUM(
            CASE
                WHEN ts.tipe_transaksi IN ('TARIK', 'KOREKSI_KELUAR') THEN ts.nominal
                ELSE 0
            END
        ) AS total_tarik
    FROM transaksi_simpanan ts
    GROUP BY ts.anggota_id, ts.jenis_simpanan_id
) trx
    ON trx.anggota_id = a.id
   AND trx.jenis_simpanan_id = js.id
LEFT JOIN (
    SELECT
        tg.anggota_id,
        tg.jenis_simpanan_id,
        SUM(tg.nominal_tagihan) AS total_tagihan,
        SUM(
            CASE
                WHEN tg.status_tagihan IN ('BELUM_BAYAR', 'SEBAGIAN')
                 AND tg.tanggal_jatuh_tempo IS NOT NULL
                 AND tg.tanggal_jatuh_tempo < CURRENT_DATE
                THEN (tg.nominal_tagihan - tg.nominal_terbayar)
                ELSE 0
            END
        ) AS total_tunggakan
    FROM tagihan_simpanan tg
    GROUP BY tg.anggota_id, tg.jenis_simpanan_id
) tag
    ON tag.anggota_id = a.id
   AND tag.jenis_simpanan_id = js.id
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
