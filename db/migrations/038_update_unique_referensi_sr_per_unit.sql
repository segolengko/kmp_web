ALTER TABLE IF EXISTS referensi_sr
DROP CONSTRAINT IF EXISTS uq_referensi_sr_mitra_nomor;

ALTER TABLE IF EXISTS referensi_sr
ADD CONSTRAINT uq_referensi_sr_unit_mitra_nomor
UNIQUE (unit_bisnis_id, mitra_perusahaan_id, no_sr);
