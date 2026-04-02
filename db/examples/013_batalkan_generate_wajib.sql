SELECT
    b.id,
    b.kode_batch,
    b.periode_tahun,
    b.periode_bulan,
    b.status_batch,
    b.total_tagihan_terbentuk
FROM batch_generate_tagihan_simpanan b
JOIN jenis_simpanan js ON js.id = b.jenis_simpanan_id
WHERE js.kode = 'SW'
  AND b.status_batch <> 'DIBATALKAN'
ORDER BY b.id DESC;

-- Ganti angka 2 dengan id batch SW yang masih aktif dan ingin dibatalkan.
SELECT *
FROM fn_batalkan_generate_wajib(
    2,
    'admin',
    'Pembatalan batch generate untuk koreksi periode trial.'
);

SELECT
    id,
    kode_batch,
    periode_tahun,
    periode_bulan,
    total_anggota,
    total_tagihan_terbentuk,
    status_batch,
    catatan
FROM batch_generate_tagihan_simpanan
ORDER BY id DESC;
