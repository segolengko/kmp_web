CREATE TABLE IF NOT EXISTS referensi_jo (
    id BIGSERIAL PRIMARY KEY,
    penawaran_project_id BIGINT NOT NULL REFERENCES penawaran_project (id) ON DELETE CASCADE,
    no_jo VARCHAR(120) NOT NULL,
    tanggal_jo DATE NOT NULL,
    cost_center VARCHAR(120),
    departemen_mitra VARCHAR(150),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_referensi_jo_nomor UNIQUE (no_jo)
);

CREATE TABLE IF NOT EXISTS tagihan_project (
    id BIGSERIAL PRIMARY KEY,
    referensi_jo_id BIGINT NOT NULL REFERENCES referensi_jo (id) ON DELETE CASCADE,
    no_tagihan VARCHAR(120) NOT NULL,
    tanggal_tagihan DATE NOT NULL,
    subtotal NUMERIC(18, 2) NOT NULL DEFAULT 0,
    nilai_ppn NUMERIC(18, 2) NOT NULL DEFAULT 0,
    nilai_total NUMERIC(18, 2) NOT NULL DEFAULT 0,
    status_tagihan VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    no_jpr VARCHAR(120),
    tanggal_jpr DATE,
    estimasi_cair_at DATE,
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tagihan_project_nomor UNIQUE (no_tagihan),
    CONSTRAINT ck_tagihan_project_status
        CHECK (status_tagihan IN ('DRAFT', 'DOKUMEN_SIAP', 'TERKIRIM', 'JPR_TERBIT', 'MENUNGGU_CAIR', 'TERBAYAR', 'LUNAS', 'CLOSED')),
    CONSTRAINT ck_tagihan_project_subtotal CHECK (subtotal >= 0),
    CONSTRAINT ck_tagihan_project_nilai_ppn CHECK (nilai_ppn >= 0),
    CONSTRAINT ck_tagihan_project_nilai_total CHECK (nilai_total >= 0)
);

CREATE TABLE IF NOT EXISTS dokumen_tagihan_project (
    id BIGSERIAL PRIMARY KEY,
    tagihan_project_id BIGINT NOT NULL REFERENCES tagihan_project (id) ON DELETE CASCADE,
    jenis_dokumen VARCHAR(30) NOT NULL,
    no_dokumen VARCHAR(120),
    tanggal_dokumen DATE,
    file_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_dokumen_tagihan_project_jenis
        CHECK (jenis_dokumen IN ('JCPR', 'INVOICE', 'BERITA_ACARA', 'FAKTUR_PAJAK', 'JPR')),
    CONSTRAINT uq_dokumen_tagihan_project_jenis UNIQUE (tagihan_project_id, jenis_dokumen)
);

CREATE TABLE IF NOT EXISTS pencairan_tagihan_project (
    id BIGSERIAL PRIMARY KEY,
    tagihan_project_id BIGINT NOT NULL REFERENCES tagihan_project (id) ON DELETE CASCADE,
    tanggal_pencairan DATE NOT NULL,
    nominal_pencairan NUMERIC(18, 2) NOT NULL DEFAULT 0,
    catatan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_pencairan_tagihan_project_nominal CHECK (nominal_pencairan >= 0)
);

CREATE INDEX IF NOT EXISTS idx_referensi_jo_penawaran
    ON referensi_jo (penawaran_project_id, tanggal_jo DESC);

CREATE INDEX IF NOT EXISTS idx_tagihan_project_jo
    ON tagihan_project (referensi_jo_id, tanggal_tagihan DESC);

CREATE INDEX IF NOT EXISTS idx_tagihan_project_status
    ON tagihan_project (status_tagihan);

CREATE INDEX IF NOT EXISTS idx_dokumen_tagihan_project_tagihan
    ON dokumen_tagihan_project (tagihan_project_id, jenis_dokumen);

CREATE INDEX IF NOT EXISTS idx_pencairan_tagihan_project_tagihan
    ON pencairan_tagihan_project (tagihan_project_id, tanggal_pencairan DESC);
