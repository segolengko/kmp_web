INSERT INTO pengaturan_simpanan (
    jenis_simpanan_id,
    nama_pengaturan,
    nominal,
    berlaku_mulai,
    berlaku_sampai,
    aktif,
    keterangan
)
SELECT
    js.id,
    'Simpanan Wajib 2026',
    100000.00,
    DATE '2026-01-01',
    NULL,
    TRUE,
    'Nominal simpanan wajib bulanan untuk tahun 2026.'
FROM jenis_simpanan js
WHERE js.kode = 'SW'
  AND NOT EXISTS (
      SELECT 1
      FROM pengaturan_simpanan ps
      WHERE ps.jenis_simpanan_id = js.id
        AND ps.nama_pengaturan = 'Simpanan Wajib 2026'
  );

INSERT INTO pengaturan_simpanan (
    jenis_simpanan_id,
    nama_pengaturan,
    nominal,
    berlaku_mulai,
    berlaku_sampai,
    aktif,
    keterangan
)
SELECT
    js.id,
    'Simpanan Pokok',
    500000.00,
    DATE '2026-01-01',
    NULL,
    TRUE,
    'Nominal simpanan pokok yang ditagihkan satu kali saat anggota masuk.'
FROM jenis_simpanan js
WHERE js.kode = 'SP'
  AND NOT EXISTS (
      SELECT 1
      FROM pengaturan_simpanan ps
      WHERE ps.jenis_simpanan_id = js.id
        AND ps.nama_pengaturan = 'Simpanan Pokok'
  );

INSERT INTO pengaturan_simpanan (
    jenis_simpanan_id,
    nama_pengaturan,
    nominal,
    berlaku_mulai,
    berlaku_sampai,
    aktif,
    keterangan
)
SELECT
    js.id,
    'Simpanan Penyertaan',
    1500000.00,
    DATE '2026-01-01',
    NULL,
    TRUE,
    'Nominal simpanan penyertaan yang ditagihkan satu kali dan boleh dicicil.'
FROM jenis_simpanan js
WHERE js.kode = 'SPN'
  AND NOT EXISTS (
      SELECT 1
      FROM pengaturan_simpanan ps
      WHERE ps.jenis_simpanan_id = js.id
        AND ps.nama_pengaturan = 'Simpanan Penyertaan'
  );
