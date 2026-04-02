CREATE TABLE IF NOT EXISTS riwayat_keanggotaan (
    id BIGSERIAL PRIMARY KEY,
    anggota_id BIGINT NOT NULL REFERENCES anggota (id),
    tanggal_perubahan DATE NOT NULL,
    jenis_anggota_lama VARCHAR(20),
    jenis_anggota_baru VARCHAR(20),
    status_anggota_lama VARCHAR(20),
    status_anggota_baru VARCHAR(20),
    tanggal_berlaku DATE NOT NULL,
    alasan_perubahan VARCHAR(255),
    keterangan TEXT,
    dibuat_oleh VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_riwayat_keanggotaan_jenis_lama
        CHECK (
            jenis_anggota_lama IS NULL
            OR jenis_anggota_lama IN ('BIASA', 'LUAR_BIASA')
        ),
    CONSTRAINT ck_riwayat_keanggotaan_jenis_baru
        CHECK (
            jenis_anggota_baru IS NULL
            OR jenis_anggota_baru IN ('BIASA', 'LUAR_BIASA')
        ),
    CONSTRAINT ck_riwayat_keanggotaan_status_lama
        CHECK (
            status_anggota_lama IS NULL
            OR status_anggota_lama IN ('AKTIF', 'PASIF', 'KELUAR')
        ),
    CONSTRAINT ck_riwayat_keanggotaan_status_baru
        CHECK (
            status_anggota_baru IS NULL
            OR status_anggota_baru IN ('AKTIF', 'PASIF', 'KELUAR')
        )
);

CREATE INDEX IF NOT EXISTS idx_riwayat_keanggotaan_anggota
    ON riwayat_keanggotaan (anggota_id);

CREATE INDEX IF NOT EXISTS idx_riwayat_keanggotaan_tanggal
    ON riwayat_keanggotaan (tanggal_berlaku, tanggal_perubahan);

CREATE INDEX IF NOT EXISTS idx_riwayat_keanggotaan_status
    ON riwayat_keanggotaan (status_anggota_lama, status_anggota_baru);

CREATE INDEX IF NOT EXISTS idx_riwayat_keanggotaan_jenis
    ON riwayat_keanggotaan (jenis_anggota_lama, jenis_anggota_baru);
