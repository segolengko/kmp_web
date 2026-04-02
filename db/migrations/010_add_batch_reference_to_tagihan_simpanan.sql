ALTER TABLE tagihan_simpanan
ADD COLUMN IF NOT EXISTS batch_generate_tagihan_simpanan_id BIGINT
    REFERENCES batch_generate_tagihan_simpanan (id);

CREATE INDEX IF NOT EXISTS idx_tagihan_simpanan_batch_generate
    ON tagihan_simpanan (batch_generate_tagihan_simpanan_id);
