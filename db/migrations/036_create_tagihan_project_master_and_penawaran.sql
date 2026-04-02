CREATE TABLE IF NOT EXISTS unit_bisnis (
    id BIGSERIAL PRIMARY KEY,
    kode_unit VARCHAR(30) NOT NULL,
    nama_unit VARCHAR(150) NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_unit_bisnis_kode UNIQUE (kode_unit)
);

CREATE TABLE IF NOT EXISTS mitra_perusahaan (
    id BIGSERIAL PRIMARY KEY,
    nama_perusahaan VARCHAR(200) NOT NULL,
    alamat TEXT,
    npwp VARCHAR(50),
    pic_nama VARCHAR(150),
    pic_jabatan VARCHAR(150),
    pic_email VARCHAR(150),
    pic_hp VARCHAR(50),
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referensi_sr (
    id BIGSERIAL PRIMARY KEY,
    unit_bisnis_id BIGINT NOT NULL REFERENCES unit_bisnis (id),
    mitra_perusahaan_id BIGINT NOT NULL REFERENCES mitra_perusahaan (id),
    no_sr VARCHAR(120) NOT NULL,
    tanggal_sr DATE NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_referensi_sr_unit_mitra_nomor UNIQUE (unit_bisnis_id, mitra_perusahaan_id, no_sr)
);

CREATE TABLE IF NOT EXISTS pejabat_ttd (
    id BIGSERIAL PRIMARY KEY,
    nama_pejabat VARCHAR(150) NOT NULL,
    jabatan_pejabat VARCHAR(150) NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS penawaran_project (
    id BIGSERIAL PRIMARY KEY,
    referensi_sr_id BIGINT NOT NULL REFERENCES referensi_sr (id),
    no_penawaran VARCHAR(120) NOT NULL,
    tanggal_penawaran DATE NOT NULL,
    perihal VARCHAR(200) NOT NULL,
    pembuka_surat TEXT,
    subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0,
    nilai_ppn NUMERIC(18, 2) NOT NULL DEFAULT 0,
    nilai_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
    terbilang TEXT,
    tempat_ttd VARCHAR(150),
    tanggal_ttd DATE,
    pejabat_ttd_id BIGINT REFERENCES pejabat_ttd (id),
    penandatangan_nama VARCHAR(150),
    penandatangan_jabatan VARCHAR(150),
    pejabat_ttd_2_id BIGINT REFERENCES pejabat_ttd (id),
    penandatangan_nama_2 VARCHAR(150),
    penandatangan_jabatan_2 VARCHAR(150),
    pejabat_ttd_3_id BIGINT REFERENCES pejabat_ttd (id),
    penandatangan_nama_3 VARCHAR(150),
    penandatangan_jabatan_3 VARCHAR(150),
    status_penawaran VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_penawaran_project_nomor UNIQUE (no_penawaran),
    CONSTRAINT ck_penawaran_project_status
        CHECK (status_penawaran IN ('DRAFT', 'TERKIRIM', 'MENANG', 'KALAH', 'BATAL')),
    CONSTRAINT ck_penawaran_project_subtotal CHECK (subtotal >= 0),
    CONSTRAINT ck_penawaran_project_nilai_ppn CHECK (nilai_ppn >= 0),
    CONSTRAINT ck_penawaran_project_nilai_total CHECK (nilai_total >= 0)
);

CREATE TABLE IF NOT EXISTS penawaran_project_item (
    id BIGSERIAL PRIMARY KEY,
    penawaran_project_id BIGINT NOT NULL REFERENCES penawaran_project (id) ON DELETE CASCADE,
    urutan INTEGER NOT NULL DEFAULT 1,
    nama_item VARCHAR(200) NOT NULL,
    deskripsi_item TEXT,
    qty NUMERIC(18, 2) NOT NULL DEFAULT 0,
    satuan VARCHAR(50),
    harga_satuan NUMERIC(18, 2) NOT NULL DEFAULT 0,
    jumlah NUMERIC(18, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_penawaran_project_item_qty CHECK (qty >= 0),
    CONSTRAINT ck_penawaran_project_item_harga_satuan CHECK (harga_satuan >= 0),
    CONSTRAINT ck_penawaran_project_item_jumlah CHECK (jumlah >= 0)
);

CREATE INDEX IF NOT EXISTS idx_referensi_sr_unit_bisnis
    ON referensi_sr (unit_bisnis_id);

CREATE INDEX IF NOT EXISTS idx_referensi_sr_mitra
    ON referensi_sr (mitra_perusahaan_id);

CREATE INDEX IF NOT EXISTS idx_penawaran_project_sr
    ON penawaran_project (referensi_sr_id);

CREATE INDEX IF NOT EXISTS idx_penawaran_project_status
    ON penawaran_project (status_penawaran);

CREATE INDEX IF NOT EXISTS idx_penawaran_project_pejabat_ttd
    ON penawaran_project (pejabat_ttd_id);

CREATE INDEX IF NOT EXISTS idx_penawaran_project_pejabat_ttd_2
    ON penawaran_project (pejabat_ttd_2_id);

CREATE INDEX IF NOT EXISTS idx_penawaran_project_pejabat_ttd_3
    ON penawaran_project (pejabat_ttd_3_id);

CREATE INDEX IF NOT EXISTS idx_penawaran_project_item_penawaran
    ON penawaran_project_item (penawaran_project_id, urutan);
