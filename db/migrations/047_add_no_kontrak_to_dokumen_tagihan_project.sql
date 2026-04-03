ALTER TABLE IF EXISTS dokumen_tagihan_project
ADD COLUMN IF NOT EXISTS no_kontrak VARCHAR(120);

CREATE INDEX IF NOT EXISTS idx_dokumen_tagihan_project_no_kontrak
    ON dokumen_tagihan_project (no_kontrak);
