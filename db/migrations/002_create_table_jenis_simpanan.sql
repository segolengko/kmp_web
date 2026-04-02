CREATE TABLE IF NOT EXISTS jenis_simpanan (
    id BIGSERIAL PRIMARY KEY,
    kode VARCHAR(30) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    kategori VARCHAR(30) NOT NULL,
    frekuensi VARCHAR(20) NOT NULL,
    wajib BOOLEAN NOT NULL DEFAULT TRUE,
    model_pencatatan VARCHAR(20) NOT NULL,
    boleh_cicil BOOLEAN NOT NULL DEFAULT FALSE,
    bisa_ditarik BOOLEAN NOT NULL DEFAULT FALSE,
    nominal_default NUMERIC(18, 2) NOT NULL DEFAULT 0,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    keterangan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_jenis_simpanan_kode UNIQUE (kode),
    CONSTRAINT uq_jenis_simpanan_nama UNIQUE (nama),
    CONSTRAINT ck_jenis_simpanan_kategori
        CHECK (kategori IN ('POKOK', 'WAJIB', 'SUKARELA', 'PENYERTAAN')),
    CONSTRAINT ck_jenis_simpanan_frekuensi
        CHECK (frekuensi IN ('SEKALI', 'HARIAN', 'MINGGUAN', 'BULANAN', 'TAHUNAN', 'FLEKSIBEL')),
    CONSTRAINT ck_jenis_simpanan_model_pencatatan
        CHECK (model_pencatatan IN ('TAGIHAN', 'TRANSAKSI_LANGSUNG')),
    CONSTRAINT ck_jenis_simpanan_nominal
        CHECK (nominal_default >= 0)
);

CREATE INDEX IF NOT EXISTS idx_jenis_simpanan_kategori
    ON jenis_simpanan (kategori);

CREATE INDEX IF NOT EXISTS idx_jenis_simpanan_aktif
    ON jenis_simpanan (aktif);

INSERT INTO jenis_simpanan (
    kode,
    nama,
    kategori,
    frekuensi,
    wajib,
    model_pencatatan,
    boleh_cicil,
    bisa_ditarik,
    nominal_default,
    aktif,
    keterangan
)
VALUES
    (
        'SW',
        'Simpanan Wajib',
        'WAJIB',
        'BULANAN',
        TRUE,
        'TAGIHAN',
        TRUE,
        TRUE,
        0,
        TRUE,
        'Simpanan wajib yang ditagihkan setiap bulan selama anggota belum keluar dari koperasi.'
    ),
    (
        'SP',
        'Simpanan Pokok',
        'POKOK',
        'SEKALI',
        TRUE,
        'TAGIHAN',
        FALSE,
        TRUE,
        0,
        TRUE,
        'Simpanan pokok yang dibayarkan satu kali saat menjadi anggota koperasi.'
    ),
    (
        'SS',
        'Simpanan Sukarela',
        'SUKARELA',
        'FLEKSIBEL',
        FALSE,
        'TRANSAKSI_LANGSUNG',
        FALSE,
        TRUE,
        0,
        TRUE,
        'Simpanan sukarela yang dapat disetor anggota sesuai kebutuhan atau kemampuan.'
    ),
    (
        'SPN',
        'Simpanan Penyertaan',
        'PENYERTAAN',
        'SEKALI',
        TRUE,
        'TAGIHAN',
        TRUE,
        FALSE,
        0,
        TRUE,
        'Simpanan penyertaan sebagai modal anggota dengan nominal besar dan dapat dicicil.'
    )
ON CONFLICT (kode) DO NOTHING;
