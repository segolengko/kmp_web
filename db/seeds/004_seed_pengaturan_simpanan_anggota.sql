INSERT INTO pengaturan_simpanan_anggota (
    anggota_id,
    jenis_simpanan_id,
    nama_pengaturan,
    nominal,
    berlaku_mulai,
    berlaku_sampai,
    aktif,
    keterangan
)
SELECT
    a.id,
    js.id,
    'SW AG0001 2026',
    100000.00,
    DATE '2026-01-01',
    NULL,
    TRUE,
    'Nominal simpanan wajib khusus anggota AG0001.'
FROM anggota a
CROSS JOIN jenis_simpanan js
WHERE a.no_anggota = 'AG0001'
  AND js.kode = 'SW'
  AND NOT EXISTS (
      SELECT 1
      FROM pengaturan_simpanan_anggota psa
      WHERE psa.anggota_id = a.id
        AND psa.jenis_simpanan_id = js.id
        AND psa.nama_pengaturan = 'SW AG0001 2026'
  );

INSERT INTO pengaturan_simpanan_anggota (
    anggota_id,
    jenis_simpanan_id,
    nama_pengaturan,
    nominal,
    berlaku_mulai,
    berlaku_sampai,
    aktif,
    keterangan
)
SELECT
    a.id,
    js.id,
    'SW AG0002 2026',
    150000.00,
    DATE '2026-01-01',
    NULL,
    TRUE,
    'Nominal simpanan wajib khusus anggota AG0002.'
FROM anggota a
CROSS JOIN jenis_simpanan js
WHERE a.no_anggota = 'AG0002'
  AND js.kode = 'SW'
  AND NOT EXISTS (
      SELECT 1
      FROM pengaturan_simpanan_anggota psa
      WHERE psa.anggota_id = a.id
        AND psa.jenis_simpanan_id = js.id
        AND psa.nama_pengaturan = 'SW AG0002 2026'
  );

INSERT INTO pengaturan_simpanan_anggota (
    anggota_id,
    jenis_simpanan_id,
    nama_pengaturan,
    nominal,
    berlaku_mulai,
    berlaku_sampai,
    aktif,
    keterangan
)
SELECT
    a.id,
    js.id,
    'SW AG0003 2026',
    125000.00,
    DATE '2026-01-01',
    NULL,
    TRUE,
    'Nominal simpanan wajib khusus anggota AG0003.'
FROM anggota a
CROSS JOIN jenis_simpanan js
WHERE a.no_anggota = 'AG0003'
  AND js.kode = 'SW'
  AND NOT EXISTS (
      SELECT 1
      FROM pengaturan_simpanan_anggota psa
      WHERE psa.anggota_id = a.id
        AND psa.jenis_simpanan_id = js.id
        AND psa.nama_pengaturan = 'SW AG0003 2026'
  );
