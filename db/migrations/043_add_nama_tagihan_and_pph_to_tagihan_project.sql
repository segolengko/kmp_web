ALTER TABLE IF EXISTS tagihan_project
ADD COLUMN IF NOT EXISTS nama_tagihan VARCHAR(200);

ALTER TABLE IF EXISTS tagihan_project
ADD COLUMN IF NOT EXISTS nilai_pph NUMERIC(18, 2) NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS tagihan_project
ADD CONSTRAINT ck_tagihan_project_nilai_pph CHECK (nilai_pph >= 0);
