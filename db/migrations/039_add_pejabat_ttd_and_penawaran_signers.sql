CREATE TABLE IF NOT EXISTS pejabat_ttd (
    id BIGSERIAL PRIMARY KEY,
    nama_pejabat VARCHAR(150) NOT NULL,
    jabatan_pejabat VARCHAR(150) NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS penawaran_project
ADD COLUMN IF NOT EXISTS pejabat_ttd_id BIGINT REFERENCES pejabat_ttd (id);

ALTER TABLE IF EXISTS penawaran_project
ADD COLUMN IF NOT EXISTS pejabat_ttd_2_id BIGINT REFERENCES pejabat_ttd (id);

ALTER TABLE IF EXISTS penawaran_project
ADD COLUMN IF NOT EXISTS penandatangan_nama_2 VARCHAR(150);

ALTER TABLE IF EXISTS penawaran_project
ADD COLUMN IF NOT EXISTS penandatangan_jabatan_2 VARCHAR(150);

ALTER TABLE IF EXISTS penawaran_project
ADD COLUMN IF NOT EXISTS pejabat_ttd_3_id BIGINT REFERENCES pejabat_ttd (id);

ALTER TABLE IF EXISTS penawaran_project
ADD COLUMN IF NOT EXISTS penandatangan_nama_3 VARCHAR(150);

ALTER TABLE IF EXISTS penawaran_project
ADD COLUMN IF NOT EXISTS penandatangan_jabatan_3 VARCHAR(150);

CREATE INDEX IF NOT EXISTS idx_penawaran_project_pejabat_ttd
    ON penawaran_project (pejabat_ttd_id);

CREATE INDEX IF NOT EXISTS idx_penawaran_project_pejabat_ttd_2
    ON penawaran_project (pejabat_ttd_2_id);

CREATE INDEX IF NOT EXISTS idx_penawaran_project_pejabat_ttd_3
    ON penawaran_project (pejabat_ttd_3_id);
