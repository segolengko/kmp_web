CREATE OR REPLACE VIEW v_tunggakan_simpanan_wajib AS
SELECT
    ts.id AS tagihan_id,
    ts.no_tagihan,
    ts.anggota_id,
    a.no_anggota,
    a.nama_lengkap,
    a.jenis_anggota,
    a.status_anggota,
    ts.jenis_simpanan_id,
    js.kode AS kode_simpanan,
    js.nama AS nama_simpanan,
    ts.periode_label,
    ts.periode_tahun,
    ts.periode_bulan,
    ts.tanggal_tagihan,
    ts.tanggal_jatuh_tempo,
    ts.nominal_tagihan,
    ts.nominal_terbayar,
    (ts.nominal_tagihan - ts.nominal_terbayar) AS sisa_tunggakan,
    GREATEST(0, CURRENT_DATE - ts.tanggal_jatuh_tempo) AS umur_tunggakan_hari,
    ts.status_tagihan
FROM tagihan_simpanan ts
JOIN anggota a ON a.id = ts.anggota_id
JOIN jenis_simpanan js ON js.id = ts.jenis_simpanan_id
WHERE js.kode = 'SW'
  AND ts.status_tagihan IN ('BELUM_BAYAR', 'SEBAGIAN')
  AND ts.tanggal_jatuh_tempo IS NOT NULL
  AND ts.tanggal_jatuh_tempo < CURRENT_DATE;
