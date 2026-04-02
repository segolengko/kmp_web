SELECT *
FROM fn_proses_anggota_keluar_lengkap(
    'AG0003',
    DATE '2026-06-20',
    'Pengajuan keluar anggota diproses lengkap.',
    'Status diubah ke keluar dan draft penarikan otomatis dibuat.',
    'admin'
);

SELECT
    a.no_anggota,
    a.nama_lengkap,
    a.status_anggota,
    a.tanggal_keluar_koperasi
FROM anggota a
WHERE a.no_anggota = 'AG0003';

SELECT
    ps.no_penarikan,
    js.kode,
    ps.nominal_pengajuan,
    ps.status_penarikan
FROM penarikan_simpanan ps
JOIN anggota a ON a.id = ps.anggota_id
JOIN jenis_simpanan js ON js.id = ps.jenis_simpanan_id
WHERE a.no_anggota = 'AG0003'
ORDER BY ps.id DESC;
