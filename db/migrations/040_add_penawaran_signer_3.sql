ALTER TABLE IF EXISTS penawaran_project
ADD COLUMN IF NOT EXISTS pejabat_ttd_3_id BIGINT REFERENCES pejabat_ttd (id);

ALTER TABLE IF EXISTS penawaran_project
ADD COLUMN IF NOT EXISTS penandatangan_nama_3 VARCHAR(150);

ALTER TABLE IF EXISTS penawaran_project
ADD COLUMN IF NOT EXISTS penandatangan_jabatan_3 VARCHAR(150);

CREATE INDEX IF NOT EXISTS idx_penawaran_project_pejabat_ttd_3
    ON penawaran_project (pejabat_ttd_3_id);
