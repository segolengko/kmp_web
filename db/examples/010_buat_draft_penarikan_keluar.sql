SELECT *
FROM fn_buat_draft_penarikan_keluar(
    'AG0003',
    DATE '2026-06-15',
    'Pengajuan penarikan simpanan karena anggota keluar.',
    'Draft otomatis setelah proses keluar anggota.',
    'admin'
);

SELECT
    ps.no_penarikan,
    a.no_anggota,
    js.kode,
    js.nama,
    ps.tanggal_pengajuan,
    ps.nominal_pengajuan,
    ps.status_penarikan
FROM penarikan_simpanan ps
JOIN anggota a ON a.id = ps.anggota_id
JOIN jenis_simpanan js ON js.id = ps.jenis_simpanan_id
WHERE a.no_anggota = 'AG0003'
ORDER BY ps.id DESC;
