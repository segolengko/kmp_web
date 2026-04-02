CREATE TABLE IF NOT EXISTS batch_generate_tagihan_simpanan (
    id BIGSERIAL PRIMARY KEY,
    kode_batch VARCHAR(40) NOT NULL,
    jenis_simpanan_id BIGINT NOT NULL REFERENCES jenis_simpanan (id),
    periode_tahun SMALLINT NOT NULL,
    periode_bulan SMALLINT NOT NULL,
    tanggal_proses TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_anggota INTEGER NOT NULL DEFAULT 0,
    total_tagihan_terbentuk INTEGER NOT NULL DEFAULT 0,
    status_batch VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    catatan TEXT,
    dibuat_oleh VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_batch_generate_tagihan_kode UNIQUE (kode_batch),
    CONSTRAINT uq_batch_generate_tagihan_periode UNIQUE (jenis_simpanan_id, periode_tahun, periode_bulan),
    CONSTRAINT ck_batch_generate_tagihan_periode_bulan
        CHECK (periode_bulan BETWEEN 1 AND 12),
    CONSTRAINT ck_batch_generate_tagihan_total_anggota
        CHECK (total_anggota >= 0),
    CONSTRAINT ck_batch_generate_tagihan_total_tagihan
        CHECK (total_tagihan_terbentuk >= 0),
    CONSTRAINT ck_batch_generate_tagihan_status
        CHECK (status_batch IN ('DRAFT', 'PROSES', 'SELESAI', 'GAGAL', 'DIBATALKAN'))
);

CREATE INDEX IF NOT EXISTS idx_batch_generate_tagihan_jenis
    ON batch_generate_tagihan_simpanan (jenis_simpanan_id);

CREATE INDEX IF NOT EXISTS idx_batch_generate_tagihan_periode
    ON batch_generate_tagihan_simpanan (periode_tahun, periode_bulan);

CREATE INDEX IF NOT EXISTS idx_batch_generate_tagihan_status
    ON batch_generate_tagihan_simpanan (status_batch);
