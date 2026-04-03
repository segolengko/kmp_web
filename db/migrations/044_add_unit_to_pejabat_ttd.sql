ALTER TABLE IF EXISTS pejabat_ttd
ADD COLUMN IF NOT EXISTS unit_bisnis_id BIGINT REFERENCES unit_bisnis (id);

CREATE INDEX IF NOT EXISTS idx_pejabat_ttd_unit_bisnis
    ON pejabat_ttd (unit_bisnis_id);
