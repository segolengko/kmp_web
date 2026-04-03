ALTER TABLE IF EXISTS tagihan_project
ALTER COLUMN referensi_jo_id DROP NOT NULL;

ALTER TABLE IF EXISTS tagihan_project
ADD COLUMN IF NOT EXISTS unit_bisnis_id BIGINT REFERENCES unit_bisnis (id);

ALTER TABLE IF EXISTS tagihan_project
ADD COLUMN IF NOT EXISTS no_penawaran VARCHAR(120);

ALTER TABLE IF EXISTS tagihan_project
ADD COLUMN IF NOT EXISTS no_jo VARCHAR(120);

ALTER TABLE IF EXISTS tagihan_project
ADD COLUMN IF NOT EXISTS no_jcpr VARCHAR(120);

ALTER TABLE IF EXISTS tagihan_project
ADD COLUMN IF NOT EXISTS no_berita_acara VARCHAR(120);

ALTER TABLE IF EXISTS tagihan_project
ADD COLUMN IF NOT EXISTS no_faktur_pajak VARCHAR(120);

ALTER TABLE IF EXISTS tagihan_project
ADD COLUMN IF NOT EXISTS no_invoice VARCHAR(120);

UPDATE tagihan_project AS tp
SET
    unit_bisnis_id = COALESCE(tp.unit_bisnis_id, sr.unit_bisnis_id),
    no_penawaran = COALESCE(tp.no_penawaran, pp.no_penawaran),
    no_jo = COALESCE(tp.no_jo, rj.no_jo)
FROM referensi_jo AS rj
JOIN penawaran_project AS pp ON pp.id = rj.penawaran_project_id
JOIN referensi_sr AS sr ON sr.id = pp.referensi_sr_id
WHERE tp.referensi_jo_id = rj.id;

CREATE INDEX IF NOT EXISTS idx_tagihan_project_unit_bisnis
    ON tagihan_project (unit_bisnis_id, tanggal_tagihan DESC);
