-- Contoh setup cepat untuk trial anggota LUAR_BIASA + PASIF
-- Sesuaikan no anggota dan identitas bila diperlukan.

INSERT INTO anggota (
    no_anggota,
    nik,
    nama_lengkap,
    jenis_kelamin,
    tempat_lahir,
    tanggal_lahir,
    alamat,
    no_hp,
    departemen,
    jabatan,
    tanggal_masuk_koperasi,
    jenis_anggota,
    status_anggota,
    aktif,
    keterangan_status_anggota
)
VALUES (
    'AG-LBP-001',
    '3174000101010999',
    'Contoh Luar Biasa Pasif',
    'LAKI_LAKI',
    'Bandung',
    DATE '1980-01-01',
    'Jl. Contoh Anggota Pasif',
    '081200009999',
    'Purnakarya',
    'Pensiunan',
    DATE '2024-01-01',
    'LUAR_BIASA',
    'PASIF',
    FALSE,
    'Contoh anggota luar biasa pasif untuk trial simpanan wajib manual.'
)
ON CONFLICT (no_anggota) DO UPDATE
SET
    jenis_anggota = EXCLUDED.jenis_anggota,
    status_anggota = EXCLUDED.status_anggota,
    aktif = EXCLUDED.aktif,
    keterangan_status_anggota = EXCLUDED.keterangan_status_anggota,
    updated_at = CURRENT_TIMESTAMP;

SELECT
    id,
    no_anggota,
    nama_lengkap,
    jenis_anggota,
    status_anggota,
    aktif
FROM anggota
WHERE no_anggota = 'AG-LBP-001';
