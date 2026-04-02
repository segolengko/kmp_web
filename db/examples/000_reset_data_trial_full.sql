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
    riwayat_keanggotaan,
    pengaturan_simpanan_anggota,
    pengaturan_simpanan,
    anggota,
    jenis_simpanan
RESTART IDENTITY CASCADE;

COMMIT;
