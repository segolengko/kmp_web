CREATE TABLE IF NOT EXISTS anggota (
    id BIGSERIAL PRIMARY KEY,
    no_anggota VARCHAR(30) NOT NULL,
    nik VARCHAR(20),
    nip VARCHAR(30),
    nama_lengkap VARCHAR(150) NOT NULL,
    jenis_kelamin VARCHAR(10) NOT NULL,
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    alamat TEXT,
    no_hp VARCHAR(20),
    email VARCHAR(150),
    foto_url VARCHAR(255),
    foto_storage_key VARCHAR(255),
    foto_mime_type VARCHAR(100),
    foto_size BIGINT,
    foto_updated_at TIMESTAMP,
    departemen VARCHAR(100),
    jabatan VARCHAR(100),
    tanggal_masuk_kerja DATE,
    tanggal_masuk_koperasi DATE NOT NULL,
    jenis_anggota VARCHAR(20) NOT NULL,
    status_anggota VARCHAR(20) NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    tanggal_keluar_koperasi DATE,
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_anggota_no_anggota UNIQUE (no_anggota),
    CONSTRAINT uq_anggota_nik UNIQUE (nik),
    CONSTRAINT ck_anggota_jenis_kelamin
        CHECK (jenis_kelamin IN ('LAKI_LAKI', 'PEREMPUAN')),
    CONSTRAINT ck_anggota_jenis_anggota
        CHECK (jenis_anggota IN ('BIASA', 'LUAR_BIASA')),
    CONSTRAINT ck_anggota_status_anggota
        CHECK (status_anggota IN ('AKTIF', 'PASIF', 'KELUAR')),
    CONSTRAINT ck_anggota_status_aktif
        CHECK (
            (status_anggota = 'AKTIF' AND aktif = TRUE)
            OR (status_anggota IN ('PASIF', 'KELUAR') AND aktif = FALSE)
        ),
    CONSTRAINT ck_anggota_tanggal_keluar
        CHECK (
            tanggal_keluar_koperasi IS NULL
            OR tanggal_keluar_koperasi >= tanggal_masuk_koperasi
        )
);

CREATE INDEX IF NOT EXISTS idx_anggota_nama_lengkap
    ON anggota (nama_lengkap);

CREATE INDEX IF NOT EXISTS idx_anggota_jenis_status
    ON anggota (jenis_anggota, status_anggota);

CREATE INDEX IF NOT EXISTS idx_anggota_departemen
    ON anggota (departemen);
