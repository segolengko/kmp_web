# Uji Database Simpanan

## Urutan Seed

Jalankan file berikut setelah migration selesai:

1. `db/seeds/001_seed_pengaturan_simpanan.sql`
2. `db/seeds/002_seed_sample_anggota.sql`
3. `db/seeds/003_seed_saldo_simpanan_anggota.sql`
4. `db/seeds/004_seed_pengaturan_simpanan_anggota.sql`

## Urutan Uji Operasional

1. `db/examples/002_buat_tagihan_awal_anggota_baru.sql`
   Untuk membuat tagihan Simpanan Pokok dan Simpanan Penyertaan anggota baru.

2. `db/examples/001_generate_tagihan_wajib_bulanan.sql`
   Untuk generate tagihan Simpanan Wajib satu periode.

3. `db/examples/003_bayar_tagihan_simpanan.sql`
   Untuk mencatat pembayaran tagihan dan alokasi ke tagihan tertua.
   Catatan: contoh default membayar `1` tagihan wajib sebesar `100000`. Jika ingin simulasi bayar `3` bulan sekaligus, generate dulu `3` tagihan bulanan yang relevan lalu ubah nominal bayar.

4. `db/examples/004_catat_simpanan_sukarela.sql`
   Untuk mencatat setoran Simpanan Sukarela.

5. `db/examples/005_refresh_saldo_simpanan_anggota.sql`
   Untuk menghitung ulang ringkasan saldo setelah ada transaksi baru.

6. `db/examples/006_cek_laporan_simpanan.sql`
   Untuk melihat ringkasan saldo dan daftar tunggakan.

7. `db/examples/007_generate_tagihan_wajib_variabel_per_anggota.sql`
   Untuk menguji generate Simpanan Wajib dengan nominal berbeda per anggota.

8. `db/examples/008_update_keanggotaan_anggota.sql`
   Untuk menguji perubahan jenis/status anggota sekaligus pencatatan histori keanggotaan.

9. `db/examples/009_proses_anggota_keluar.sql`
   Untuk menguji proses anggota keluar, histori status, dan ringkasan nilai pengembalian simpanan.

10. `db/examples/010_buat_draft_penarikan_keluar.sql`
    Untuk membuat draft penarikan simpanan otomatis setelah anggota keluar.

11. `db/examples/011_proses_penarikan_simpanan.sql`
    Untuk menguji approval dan realisasi draft penarikan simpanan.

12. `db/examples/012_proses_anggota_keluar_lengkap.sql`
    Untuk menjalankan alur keluar anggota lengkap dalam satu langkah, termasuk pembuatan draft penarikan.

## Catatan Penting

- File contoh memakai data anggota `AG0001`, `AG0002`, dan `AG0003`.
- Nominal contoh saat ini:
  - Simpanan Wajib: `100000`
  - Simpanan Pokok: `500000`
  - Simpanan Penyertaan: `1500000`
- Nominal contoh Simpanan Wajib per anggota:
  - `AG0001`: `100000`
  - `AG0002`: `150000`
  - `AG0003`: `125000`
- `005_refresh_saldo_simpanan_anggota.sql` memakai asumsi awal:
  - `saldo_tersedia` dipakai untuk Simpanan Sukarela
  - `saldo_ditahan` dipakai untuk Simpanan Penyertaan
- Kalau aturan pengembalian Simpanan Wajib dan Pokok nanti ingin dibedakan lebih detail, logika refresh saldo bisa kita sesuaikan lagi.
