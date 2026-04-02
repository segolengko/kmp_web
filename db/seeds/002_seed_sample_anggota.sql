INSERT INTO anggota (
    no_anggota,
    nik,
    nip,
    nama_lengkap,
    jenis_kelamin,
    tempat_lahir,
    tanggal_lahir,
    alamat,
    no_hp,
    email,
    departemen,
    jabatan,
    tanggal_masuk_kerja,
    tanggal_masuk_koperasi,
    jenis_anggota,
    status_anggota,
    aktif,
    catatan
)
SELECT
    'AG0001',
    '3174000101010001',
    'EMP-0001',
    'Andi Pratama',
    'LAKI_LAKI',
    'Jakarta',
    DATE '1990-01-01',
    'Jl. Melati No. 1, Jakarta',
    '081200000001',
    'andi.pratama@example.com',
    'Finance',
    'Staff',
    DATE '2020-02-01',
    DATE '2026-01-15',
    'BIASA',
    'AKTIF',
    TRUE,
    'Contoh anggota biasa aktif.'
WHERE NOT EXISTS (
    SELECT 1 FROM anggota a WHERE a.no_anggota = 'AG0001'
);

INSERT INTO anggota (
    no_anggota,
    nik,
    nip,
    nama_lengkap,
    jenis_kelamin,
    tempat_lahir,
    tanggal_lahir,
    alamat,
    no_hp,
    email,
    departemen,
    jabatan,
    tanggal_masuk_kerja,
    tanggal_masuk_koperasi,
    jenis_anggota,
    status_anggota,
    aktif,
    catatan
)
SELECT
    'AG0002',
    '3174000101010002',
    'EMP-0002',
    'Budi Santoso',
    'LAKI_LAKI',
    'Bandung',
    DATE '1988-03-10',
    'Jl. Kenanga No. 2, Bandung',
    '081200000002',
    'budi.santoso@example.com',
    'Operasional',
    'Supervisor',
    DATE '2018-06-01',
    DATE '2025-06-10',
    'LUAR_BIASA',
    'PASIF',
    FALSE,
    'Contoh anggota luar biasa pasif.'
WHERE NOT EXISTS (
    SELECT 1 FROM anggota a WHERE a.no_anggota = 'AG0002'
);

INSERT INTO anggota (
    no_anggota,
    nik,
    nip,
    nama_lengkap,
    jenis_kelamin,
    tempat_lahir,
    tanggal_lahir,
    alamat,
    no_hp,
    email,
    departemen,
    jabatan,
    tanggal_masuk_kerja,
    tanggal_masuk_koperasi,
    jenis_anggota,
    status_anggota,
    aktif,
    catatan
)
SELECT
    'AG0003',
    '3174000101010003',
    'EMP-0003',
    'Citra Lestari',
    'PEREMPUAN',
    'Semarang',
    DATE '1992-07-22',
    'Jl. Mawar No. 3, Semarang',
    '081200000003',
    'citra.lestari@example.com',
    'HR',
    'Officer',
    DATE '2021-08-01',
    DATE '2026-03-01',
    'BIASA',
    'AKTIF',
    TRUE,
    'Contoh anggota baru untuk uji tagihan pokok dan penyertaan.'
WHERE NOT EXISTS (
    SELECT 1 FROM anggota a WHERE a.no_anggota = 'AG0003'
);
