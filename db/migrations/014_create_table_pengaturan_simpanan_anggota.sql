CREATE TABLE IF NOT EXISTS pengaturan_simpanan_anggota (
    id BIGSERIAL PRIMARY KEY,
    anggota_id BIGINT NOT NULL REFERENCES anggota (id),
    jenis_simpanan_id BIGINT NOT NULL REFERENCES jenis_simpanan (id),
    nama_pengaturan VARCHAR(150) NOT NULL,
    nominal NUMERIC(18, 2) NOT NULL,
    berlaku_mulai DATE NOT NULL,
    berlaku_sampai DATE,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    keterangan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_pengaturan_simpanan_anggota_nominal
        CHECK (nominal > 0),
    CONSTRAINT ck_pengaturan_simpanan_anggota_periode
        CHECK (berlaku_sampai IS NULL OR berlaku_sampai >= berlaku_mulai)
);

CREATE INDEX IF NOT EXISTS idx_pengaturan_simpanan_anggota_anggota
    ON pengaturan_simpanan_anggota (anggota_id);

CREATE INDEX IF NOT EXISTS idx_pengaturan_simpanan_anggota_jenis
    ON pengaturan_simpanan_anggota (jenis_simpanan_id);

CREATE INDEX IF NOT EXISTS idx_pengaturan_simpanan_anggota_aktif
    ON pengaturan_simpanan_anggota (aktif);

CREATE INDEX IF NOT EXISTS idx_pengaturan_simpanan_anggota_periode
    ON pengaturan_simpanan_anggota (berlaku_mulai, berlaku_sampai);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pengaturan_simpanan_anggota_nama
    ON pengaturan_simpanan_anggota (anggota_id, jenis_simpanan_id, nama_pengaturan);
