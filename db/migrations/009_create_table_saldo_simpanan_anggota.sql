CREATE TABLE IF NOT EXISTS saldo_simpanan_anggota (
    id BIGSERIAL PRIMARY KEY,
    anggota_id BIGINT NOT NULL REFERENCES anggota (id),
    jenis_simpanan_id BIGINT NOT NULL REFERENCES jenis_simpanan (id),
    saldo_terbentuk NUMERIC(18, 2) NOT NULL DEFAULT 0,
    saldo_ditahan NUMERIC(18, 2) NOT NULL DEFAULT 0,
    saldo_tersedia NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_setor NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_tarik NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_tagihan NUMERIC(18, 2) NOT NULL DEFAULT 0,
    total_tunggakan NUMERIC(18, 2) NOT NULL DEFAULT 0,
    terakhir_dihitung_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_saldo_simpanan_anggota UNIQUE (anggota_id, jenis_simpanan_id),
    CONSTRAINT ck_saldo_simpanan_anggota_saldo_terbentuk
        CHECK (saldo_terbentuk >= 0),
    CONSTRAINT ck_saldo_simpanan_anggota_saldo_ditahan
        CHECK (saldo_ditahan >= 0),
    CONSTRAINT ck_saldo_simpanan_anggota_saldo_tersedia
        CHECK (saldo_tersedia >= 0),
    CONSTRAINT ck_saldo_simpanan_anggota_total_setor
        CHECK (total_setor >= 0),
    CONSTRAINT ck_saldo_simpanan_anggota_total_tarik
        CHECK (total_tarik >= 0),
    CONSTRAINT ck_saldo_simpanan_anggota_total_tagihan
        CHECK (total_tagihan >= 0),
    CONSTRAINT ck_saldo_simpanan_anggota_total_tunggakan
        CHECK (total_tunggakan >= 0)
);

CREATE INDEX IF NOT EXISTS idx_saldo_simpanan_anggota_anggota
    ON saldo_simpanan_anggota (anggota_id);

CREATE INDEX IF NOT EXISTS idx_saldo_simpanan_anggota_jenis
    ON saldo_simpanan_anggota (jenis_simpanan_id);
