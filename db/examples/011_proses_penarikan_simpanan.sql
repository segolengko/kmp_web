SELECT *
FROM fn_proses_penarikan_simpanan(
    (
        SELECT ps.no_penarikan
        FROM penarikan_simpanan ps
        JOIN anggota a ON a.id = ps.anggota_id
        WHERE a.no_anggota = 'AG0003'
          AND ps.status_penarikan = 'DIAJUKAN'
        ORDER BY ps.id DESC
        LIMIT 1
    ),
    'DISETUJUI',
    DATE '2026-06-16',
    NULL,
    'Disetujui untuk diproses.',
    'admin'
);

SELECT *
FROM fn_proses_penarikan_simpanan(
    (
        SELECT ps.no_penarikan
        FROM penarikan_simpanan ps
        JOIN anggota a ON a.id = ps.anggota_id
        WHERE a.no_anggota = 'AG0003'
          AND ps.status_penarikan = 'DISETUJUI'
        ORDER BY ps.id DESC
        LIMIT 1
    ),
    'DIREALISASIKAN',
    DATE '2026-06-17',
    NULL,
    'Dana sudah ditransfer.',
    'admin'
);

SELECT
    ps.no_penarikan,
    ps.status_penarikan,
    ps.nominal_pengajuan,
    ps.nominal_disetujui,
    ps.tanggal_persetujuan,
    ps.tanggal_realisasi
FROM penarikan_simpanan ps
JOIN anggota a ON a.id = ps.anggota_id
WHERE a.no_anggota = 'AG0003'
ORDER BY ps.id DESC;
