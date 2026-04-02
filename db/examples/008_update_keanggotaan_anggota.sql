SELECT *
FROM fn_update_keanggotaan_anggota(
    'AG0002',
    'LUAR_BIASA',
    'PASIF',
    DATE '2026-06-01',
    NULL,
    'Perubahan status anggota sesuai keputusan pengurus.',
    'Anggota berpindah menjadi anggota luar biasa/pasif.',
    'admin'
);

SELECT
    a.no_anggota,
    a.nama_lengkap,
    a.jenis_anggota,
    a.status_anggota,
    a.tanggal_perubahan_status_terakhir,
    a.tanggal_keluar_koperasi
FROM anggota a
WHERE a.no_anggota = 'AG0002';

SELECT
    rk.id,
    a.no_anggota,
    rk.jenis_anggota_lama,
    rk.jenis_anggota_baru,
    rk.status_anggota_lama,
    rk.status_anggota_baru,
    rk.tanggal_berlaku,
    rk.alasan_perubahan
FROM riwayat_keanggotaan rk
JOIN anggota a ON a.id = rk.anggota_id
WHERE a.no_anggota = 'AG0002'
ORDER BY rk.id DESC;
