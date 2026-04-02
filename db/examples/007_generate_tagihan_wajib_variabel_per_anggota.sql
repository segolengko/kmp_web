SELECT *
FROM fn_generate_tagihan_wajib_bulanan(
    DATE '2026-06-01',
    'admin'
);

SELECT
    a.no_anggota,
    a.nama_lengkap,
    ts.periode_label,
    ts.nominal_tagihan,
    ts.keterangan
FROM tagihan_simpanan ts
JOIN anggota a ON a.id = ts.anggota_id
JOIN jenis_simpanan js ON js.id = ts.jenis_simpanan_id
WHERE js.kode = 'SW'
  AND ts.periode_tahun = 2026
  AND ts.periode_bulan = 6
ORDER BY a.no_anggota;
