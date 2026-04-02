WITH params AS (
    SELECT
        'AG0001'::VARCHAR(30) AS no_anggota_target,
        DATE '2026-04-06' AS tanggal_transaksi,
        250000.00::NUMERIC(18, 2) AS nominal_setor,
        'TUNAI'::VARCHAR(20) AS metode_bayar,
        'Setoran simpanan sukarela.'::TEXT AS keterangan,
        'admin'::VARCHAR(100) AS created_by,
        TO_CHAR(CLOCK_TIMESTAMP(), 'HH24MISSMS') AS suffix_transaksi
),
anggota_target AS (
    SELECT id
    FROM anggota
    WHERE no_anggota = (SELECT no_anggota_target FROM params)
),
jenis_target AS (
    SELECT id, kode
    FROM jenis_simpanan
    WHERE kode = 'SS'
)
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
SELECT
    FORMAT(
        'TRX-%s-%s-%s-%s',
        jt.kode,
        TO_CHAR(p.tanggal_transaksi, 'YYYYMMDD'),
        LPAD(at.id::TEXT, 6, '0'),
        p.suffix_transaksi
    ),
    p.tanggal_transaksi,
    at.id,
    jt.id,
    'TRANSAKSI_LANGSUNG',
    'SETOR',
    p.metode_bayar,
    p.nominal_setor,
    p.keterangan,
    p.created_by
FROM params p
CROSS JOIN anggota_target at
CROSS JOIN jenis_target jt;
