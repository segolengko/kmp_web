ALTER TABLE IF EXISTS pejabat_ttd
ADD COLUMN IF NOT EXISTS mitra_perusahaan_id BIGINT REFERENCES mitra_perusahaan (id);

ALTER TABLE IF EXISTS pejabat_ttd
ADD COLUMN IF NOT EXISTS modul VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_pejabat_ttd_mitra
    ON pejabat_ttd (mitra_perusahaan_id);

CREATE INDEX IF NOT EXISTS idx_pejabat_ttd_modul
    ON pejabat_ttd (modul);
