CREATE TABLE IF NOT EXISTS transaksi_simpanan (
    id BIGSERIAL PRIMARY KEY,
    no_transaksi VARCHAR(40) NOT NULL,
    tanggal_transaksi DATE NOT NULL,
    anggota_id BIGINT NOT NULL REFERENCES anggota (id),
    jenis_simpanan_id BIGINT NOT NULL REFERENCES jenis_simpanan (id),
    model_transaksi VARCHAR(25) NOT NULL,
    tipe_transaksi VARCHAR(20) NOT NULL,
    metode_bayar VARCHAR(20),
    nominal NUMERIC(18, 2) NOT NULL,
    keterangan TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_transaksi_simpanan_no_transaksi UNIQUE (no_transaksi),
    CONSTRAINT ck_transaksi_simpanan_model
        CHECK (model_transaksi IN ('PEMBAYARAN_TAGIHAN', 'TRANSAKSI_LANGSUNG')),
    CONSTRAINT ck_transaksi_simpanan_tipe
        CHECK (tipe_transaksi IN ('SETOR', 'TARIK', 'KOREKSI_MASUK', 'KOREKSI_KELUAR')),
    CONSTRAINT ck_transaksi_simpanan_metode
        CHECK (
            metode_bayar IS NULL
            OR metode_bayar IN ('POTONG_GAJI', 'TUNAI', 'TRANSFER', 'DEBET_SALDO', 'LAINNYA')
        ),
    CONSTRAINT ck_transaksi_simpanan_nominal
        CHECK (nominal > 0)
);

CREATE INDEX IF NOT EXISTS idx_transaksi_simpanan_anggota
    ON transaksi_simpanan (anggota_id);

CREATE INDEX IF NOT EXISTS idx_transaksi_simpanan_jenis
    ON transaksi_simpanan (jenis_simpanan_id);

CREATE INDEX IF NOT EXISTS idx_transaksi_simpanan_tanggal
    ON transaksi_simpanan (tanggal_transaksi);

CREATE INDEX IF NOT EXISTS idx_transaksi_simpanan_model
    ON transaksi_simpanan (model_transaksi);
