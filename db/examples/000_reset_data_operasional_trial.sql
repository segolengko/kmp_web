BEGIN;

TRUNCATE TABLE
    mutasi_titipan_simpanan,
    titipan_simpanan_anggota,
    alokasi_pembayaran_simpanan,
    transaksi_simpanan,
    penarikan_simpanan,
    tagihan_simpanan,
    batch_generate_tagihan_simpanan,
    saldo_simpanan_anggota,
    riwayat_keanggotaan
RESTART IDENTITY CASCADE;

UPDATE anggota
SET
    status_anggota = 'AKTIF',
    aktif = TRUE,
    tanggal_keluar_koperasi = NULL,
    tanggal_perubahan_status_terakhir = NULL,
    alasan_keluar_koperasi = NULL,
    keterangan_status_anggota = NULL,
    updated_at = CURRENT_TIMESTAMP;

COMMIT;
