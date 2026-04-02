# Panduan Trial Dari Nol

## Opsi Reset

### 1. Reset Operasional Saja
Pakai file ini jika Anda ingin:
- master `jenis_simpanan` tetap ada
- master `pengaturan_simpanan` tetap ada
- data anggota tetap ada
- tetapi semua data transaksi/generate/tagihan dikosongkan

File:
- `db/examples/000_reset_data_operasional_trial.sql`

Data yang dikosongkan:
- `alokasi_pembayaran_simpanan`
- `transaksi_simpanan`
- `penarikan_simpanan`
- `tagihan_simpanan`
- `batch_generate_tagihan_simpanan`
- `saldo_simpanan_anggota`
- `riwayat_keanggotaan`

Tambahan:
- status anggota dikembalikan ke `AKTIF`
- metadata keluar anggota dikosongkan

### 2. Reset Full Trial
Pakai file ini jika Anda ingin benar-benar mulai dari nol, termasuk master.

File:
- `db/examples/000_reset_data_trial_full.sql`

Data yang dikosongkan:
- seluruh data operasional
- `pengaturan_simpanan_anggota`
- `pengaturan_simpanan`
- `anggota`
- `jenis_simpanan`

## Urutan Trial Yang Disarankan

### Jika pakai reset operasional
1. Jalankan `db/examples/000_reset_data_operasional_trial.sql`
2. Cek master `jenis_simpanan`
3. Cek master `pengaturan_simpanan`
4. Cek data anggota
5. Isi `pengaturan_simpanan_anggota` kalau perlu nominal variabel
6. Jalankan `Generate Wajib`
7. Uji `Pembayaran`
8. Uji `Laporan`
9. Uji `Perubahan Keanggotaan`
10. Uji `Anggota Keluar`
11. Uji `Penarikan`

### Jika pakai reset full
1. Jalankan `db/examples/000_reset_data_trial_full.sql`
2. Isi `jenis_simpanan`
3. Isi `pengaturan_simpanan`
4. Tambah anggota
5. Isi `pengaturan_simpanan_anggota` bila ada nominal wajib variabel
6. Jalankan `Generate Wajib`
7. Uji `Pembayaran`
8. Uji `Laporan`
9. Uji `Perubahan Keanggotaan`
10. Uji `Anggota Keluar`
11. Uji `Penarikan`

## Rekomendasi

Untuk trial UI dan logic harian, saya sarankan mulai dari:
- `db/examples/000_reset_data_operasional_trial.sql`

Karena lebih cepat dan master yang sudah Anda susun tidak perlu diisi ulang.

## Aturan Operasional Simpanan Wajib

Aturan terbaru yang dipakai untuk trial:
- anggota `BIASA` dengan status `AKTIF` akan ikut generate dan langsung `LUNAS` otomatis
- anggota `LUAR_BIASA` dengan status `AKTIF` akan ikut generate dan langsung `LUNAS` otomatis
- anggota `LUAR_BIASA` dengan status `PASIF` akan ikut generate sebagai tagihan manual
- anggota `KELUAR` tidak ikut generate simpanan wajib
- anggota `KELUAR` tidak bisa melakukan pembayaran simpanan wajib baru
- nominal simpanan wajib dapat berbeda per periode dan per segmen anggota
- segmen anggota yang dipakai di master pengaturan simpanan:
  - `BIASA_AKTIF`
  - `LUAR_BIASA_AKTIF`
  - `LUAR_BIASA_PASIF`

Sumber nominal simpanan wajib tetap:
1. `pengaturan_simpanan_anggota` sebagai prioritas utama per anggota
2. `pengaturan_simpanan` per `segmen_anggota`
3. `pengaturan_simpanan` sebagai default umum bila anggota belum punya pengaturan khusus

## Catatan Trial Luar Biasa Pasif

Jika Anda ingin menguji `LUAR_BIASA + PASIF`, perhatikan:
- script `db/examples/000_reset_data_operasional_trial.sql` akan mengembalikan seluruh anggota menjadi `AKTIF`
- setelah reset operasional, Anda perlu membuat atau mengubah kembali minimal satu anggota menjadi:
  - `jenis_anggota = LUAR_BIASA`
  - `status_anggota = PASIF`
- lalu generate periode baru untuk memastikan segmen `LUAR_BIASA_PASIF` terbaca sebagai tagihan manual
