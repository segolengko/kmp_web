CREATE TABLE IF NOT EXISTS tagihan_simpanan (
    id BIGSERIAL PRIMARY KEY,
    no_tagihan VARCHAR(40) NOT NULL,
    anggota_id BIGINT NOT NULL REFERENCES anggota (id),
    jenis_simpanan_id BIGINT NOT NULL REFERENCES jenis_simpanan (id),
    periode_label VARCHAR(20) NOT NULL,
    periode_tahun SMALLINT,
    periode_bulan SMALLINT,
    tanggal_tagihan DATE NOT NULL,
    tanggal_jatuh_tempo DATE,
    nominal_tagihan NUMERIC(18, 2) NOT NULL,
    nominal_terbayar NUMERIC(18, 2) NOT NULL DEFAULT 0,
    status_tagihan VARCHAR(20) NOT NULL DEFAULT 'BELUM_BAYAR',
    keterangan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tagihan_simpanan_no_tagihan UNIQUE (no_tagihan),
    CONSTRAINT uq_tagihan_simpanan_periode UNIQUE (anggota_id, jenis_simpanan_id, periode_label),
    CONSTRAINT ck_tagihan_simpanan_periode_bulan
        CHECK (periode_bulan IS NULL OR periode_bulan BETWEEN 1 AND 12),
    CONSTRAINT ck_tagihan_simpanan_nominal_tagihan
        CHECK (nominal_tagihan > 0),
    CONSTRAINT ck_tagihan_simpanan_nominal_terbayar
        CHECK (nominal_terbayar >= 0 AND nominal_terbayar <= nominal_tagihan),
    CONSTRAINT ck_tagihan_simpanan_status
        CHECK (status_tagihan IN ('BELUM_BAYAR', 'SEBAGIAN', 'LUNAS', 'DIBATALKAN')),
    CONSTRAINT ck_tagihan_simpanan_tanggal_jatuh_tempo
        CHECK (tanggal_jatuh_tempo IS NULL OR tanggal_jatuh_tempo >= tanggal_tagihan)
);

CREATE INDEX IF NOT EXISTS idx_tagihan_simpanan_anggota
    ON tagihan_simpanan (anggota_id);

CREATE INDEX IF NOT EXISTS idx_tagihan_simpanan_jenis
    ON tagihan_simpanan (jenis_simpanan_id);

CREATE INDEX IF NOT EXISTS idx_tagihan_simpanan_status
    ON tagihan_simpanan (status_tagihan);

CREATE INDEX IF NOT EXISTS idx_tagihan_simpanan_periode
    ON tagihan_simpanan (periode_tahun, periode_bulan);
