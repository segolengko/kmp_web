CREATE TABLE IF NOT EXISTS alokasi_pembayaran_simpanan (
    id BIGSERIAL PRIMARY KEY,
    transaksi_simpanan_id BIGINT NOT NULL REFERENCES transaksi_simpanan (id),
    tagihan_simpanan_id BIGINT NOT NULL REFERENCES tagihan_simpanan (id),
    nominal_alokasi NUMERIC(18, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_alokasi_pembayaran_simpanan UNIQUE (transaksi_simpanan_id, tagihan_simpanan_id),
    CONSTRAINT ck_alokasi_pembayaran_simpanan_nominal
        CHECK (nominal_alokasi > 0)
);

CREATE INDEX IF NOT EXISTS idx_alokasi_pembayaran_transaksi
    ON alokasi_pembayaran_simpanan (transaksi_simpanan_id);

CREATE INDEX IF NOT EXISTS idx_alokasi_pembayaran_tagihan
    ON alokasi_pembayaran_simpanan (tagihan_simpanan_id);
