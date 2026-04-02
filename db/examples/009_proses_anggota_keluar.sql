SELECT *
FROM fn_proses_anggota_keluar(
    'AG0003',
    DATE '2026-06-15',
    'Mengajukan keluar dari koperasi.',
    'Pengembalian simpanan diproses setelah verifikasi seluruh kewajiban.',
    'admin'
);

SELECT
    a.no_anggota,
    a.nama_lengkap,
    a.jenis_anggota,
    a.status_anggota,
    a.tanggal_keluar_koperasi,
    a.alasan_keluar_koperasi
FROM anggota a
WHERE a.no_anggota = 'AG0003';

SELECT
    rk.id,
    a.no_anggota,
    rk.status_anggota_lama,
    rk.status_anggota_baru,
    rk.tanggal_berlaku,
    rk.alasan_perubahan
FROM riwayat_keanggotaan rk
JOIN anggota a ON a.id = rk.anggota_id
WHERE a.no_anggota = 'AG0003'
ORDER BY rk.id DESC;
