CREATE TABLE IF NOT EXISTS penarikan_simpanan (
    id BIGSERIAL PRIMARY KEY,
    no_penarikan VARCHAR(40) NOT NULL,
    anggota_id BIGINT NOT NULL REFERENCES anggota (id),
    jenis_simpanan_id BIGINT NOT NULL REFERENCES jenis_simpanan (id),
    tanggal_pengajuan DATE NOT NULL,
    tanggal_persetujuan DATE,
    tanggal_realisasi DATE,
    nominal_pengajuan NUMERIC(18, 2) NOT NULL,
    nominal_disetujui NUMERIC(18, 2),
    status_penarikan VARCHAR(20) NOT NULL DEFAULT 'DIAJUKAN',
    alasan_penarikan TEXT,
    catatan TEXT,
    diajukan_oleh VARCHAR(100),
    disetujui_oleh VARCHAR(100),
    direalisasi_oleh VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_penarikan_simpanan_no_penarikan UNIQUE (no_penarikan),
    CONSTRAINT ck_penarikan_simpanan_nominal_pengajuan
        CHECK (nominal_pengajuan > 0),
    CONSTRAINT ck_penarikan_simpanan_nominal_disetujui
        CHECK (nominal_disetujui IS NULL OR nominal_disetujui > 0),
    CONSTRAINT ck_penarikan_simpanan_status
        CHECK (status_penarikan IN ('DIAJUKAN', 'DISETUJUI', 'DITOLAK', 'DIREALISASIKAN', 'DIBATALKAN')),
    CONSTRAINT ck_penarikan_simpanan_tanggal_persetujuan
        CHECK (tanggal_persetujuan IS NULL OR tanggal_persetujuan >= tanggal_pengajuan),
    CONSTRAINT ck_penarikan_simpanan_tanggal_realisasi
        CHECK (
            tanggal_realisasi IS NULL
            OR tanggal_realisasi >= COALESCE(tanggal_persetujuan, tanggal_pengajuan)
        ),
    CONSTRAINT ck_penarikan_simpanan_nominal_disetujui_pengajuan
        CHECK (
            nominal_disetujui IS NULL
            OR nominal_disetujui <= nominal_pengajuan
        )
);

CREATE INDEX IF NOT EXISTS idx_penarikan_simpanan_anggota
    ON penarikan_simpanan (anggota_id);

CREATE INDEX IF NOT EXISTS idx_penarikan_simpanan_jenis
    ON penarikan_simpanan (jenis_simpanan_id);

CREATE INDEX IF NOT EXISTS idx_penarikan_simpanan_status
    ON penarikan_simpanan (status_penarikan);

CREATE INDEX IF NOT EXISTS idx_penarikan_simpanan_tanggal_pengajuan
    ON penarikan_simpanan (tanggal_pengajuan);
