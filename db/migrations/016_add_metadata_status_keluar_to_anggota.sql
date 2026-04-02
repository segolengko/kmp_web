ALTER TABLE anggota
ADD COLUMN IF NOT EXISTS tanggal_perubahan_status_terakhir DATE,
ADD COLUMN IF NOT EXISTS alasan_keluar_koperasi VARCHAR(255),
ADD COLUMN IF NOT EXISTS keterangan_status_anggota TEXT;
