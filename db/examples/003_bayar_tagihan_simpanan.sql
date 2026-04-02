DO $$
DECLARE
    v_nominal_bayar NUMERIC(18, 2) := 100000.00;
    v_total_sisa_tagihan NUMERIC(18, 2);
BEGIN
    SELECT COALESCE(SUM(ts.nominal_tagihan - ts.nominal_terbayar), 0)
    INTO v_total_sisa_tagihan
    FROM tagihan_simpanan ts
    JOIN anggota a ON a.id = ts.anggota_id
    JOIN jenis_simpanan js ON js.id = ts.jenis_simpanan_id
    WHERE a.no_anggota = 'AG0002'
      AND js.kode = 'SW'
      AND ts.status_tagihan IN ('BELUM_BAYAR', 'SEBAGIAN')
      AND (ts.nominal_tagihan - ts.nominal_terbayar) > 0;

    IF v_total_sisa_tagihan <= 0 THEN
        RAISE EXCEPTION 'Tidak ada tagihan terbuka untuk anggota % dan simpanan %.', 'AG0002', 'SW';
    END IF;

    IF v_nominal_bayar > v_total_sisa_tagihan THEN
        RAISE EXCEPTION
            'Nominal bayar % melebihi sisa tagihan terbuka % untuk anggota % dan simpanan %.',
            v_nominal_bayar,
            v_total_sisa_tagihan,
            'AG0002',
            'SW';
    END IF;
END $$;

WITH params AS (
    SELECT
        'AG0002'::VARCHAR(30) AS no_anggota_target,
        'SW'::VARCHAR(30) AS kode_simpanan_target,
        DATE '2026-04-05' AS tanggal_transaksi,
        100000.00::NUMERIC(18, 2) AS nominal_bayar,
        'TRANSFER'::VARCHAR(20) AS metode_bayar,
        'Pembayaran simpanan wajib 1 bulan oleh anggota pasif.'::TEXT AS keterangan,
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
    WHERE kode = (SELECT kode_simpanan_target FROM params)
),
transaksi_baru AS (
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
        'PEMBAYARAN_TAGIHAN',
        'SETOR',
        p.metode_bayar,
        p.nominal_bayar,
        p.keterangan,
        p.created_by
    FROM params p
    CROSS JOIN anggota_target at
    CROSS JOIN jenis_target jt
    RETURNING id, anggota_id, jenis_simpanan_id, nominal
),
tagihan_kandidat AS (
    SELECT
        ts.id,
        ts.periode_tahun,
        ts.periode_bulan,
        ts.tanggal_tagihan,
        (ts.nominal_tagihan - ts.nominal_terbayar) AS sisa_tagihan
    FROM tagihan_simpanan ts
    JOIN transaksi_baru tb
      ON tb.anggota_id = ts.anggota_id
     AND tb.jenis_simpanan_id = ts.jenis_simpanan_id
    WHERE ts.status_tagihan IN ('BELUM_BAYAR', 'SEBAGIAN')
      AND (ts.nominal_tagihan - ts.nominal_terbayar) > 0
),
tagihan_urut AS (
    SELECT
        tk.*,
        COALESCE(
            SUM(tk.sisa_tagihan) OVER (
                ORDER BY COALESCE(tk.periode_tahun, 0), COALESCE(tk.periode_bulan, 0), tk.tanggal_tagihan, tk.id
            ) - tk.sisa_tagihan,
            0
        ) AS total_sebelumnya
    FROM tagihan_kandidat tk
),
alokasi_hitung AS (
    SELECT
        tb.id AS transaksi_simpanan_id,
        tu.id AS tagihan_simpanan_id,
        LEAST(tb.nominal - tu.total_sebelumnya, tu.sisa_tagihan) AS nominal_alokasi
    FROM transaksi_baru tb
    JOIN tagihan_urut tu
      ON tb.nominal > tu.total_sebelumnya
),
alokasi_insert AS (
    INSERT INTO alokasi_pembayaran_simpanan (
        transaksi_simpanan_id,
        tagihan_simpanan_id,
        nominal_alokasi
    )
    SELECT
        ah.transaksi_simpanan_id,
        ah.tagihan_simpanan_id,
        ah.nominal_alokasi
    FROM alokasi_hitung ah
    WHERE ah.nominal_alokasi > 0
    RETURNING tagihan_simpanan_id, nominal_alokasi
),
tagihan_update AS (
    UPDATE tagihan_simpanan ts
    SET
        nominal_terbayar = ts.nominal_terbayar + ai.nominal_alokasi,
        status_tagihan = CASE
            WHEN ts.nominal_terbayar + ai.nominal_alokasi >= ts.nominal_tagihan THEN 'LUNAS'
            WHEN ts.nominal_terbayar + ai.nominal_alokasi > 0 THEN 'SEBAGIAN'
            ELSE 'BELUM_BAYAR'
        END,
        updated_at = CURRENT_TIMESTAMP
    FROM alokasi_insert ai
    WHERE ts.id = ai.tagihan_simpanan_id
    RETURNING ts.id
)
SELECT
    (SELECT id FROM transaksi_baru) AS transaksi_id,
    COUNT(*) AS total_tagihan_teralokasi,
    COALESCE(SUM(nominal_alokasi), 0) AS total_nominal_teralokasi
FROM alokasi_insert;
