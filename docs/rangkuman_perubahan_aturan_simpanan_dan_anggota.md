# Rangkuman Perubahan Aturan

## 1. Simpanan Wajib Variabel Per Anggota

- Simpanan wajib tidak lagi dianggap nominal tetap untuk semua anggota.
- Nominal dapat berbeda antar anggota.
- Nominal juga dapat berubah dari satu periode ke periode lain untuk anggota yang sama.
- Saat generate tagihan bulanan, sistem harus mengecek pengaturan nominal khusus per anggota terlebih dahulu.
- Jika tidak ada pengaturan khusus, sistem boleh fallback ke pengaturan umum pada `pengaturan_simpanan`.
- Nilai final yang dipakai tetap harus disimpan di `tagihan_simpanan`, supaya histori periode lama tidak ikut berubah.

## 2. Anggota Keluar Tetap Disimpan

- Data anggota tidak dihapus walaupun keluar dari koperasi.
- Status anggota diubah menjadi `KELUAR`.
- Tanggal keluar tetap dicatat di `tanggal_keluar_koperasi`.
- Histori transaksi, tagihan, dan laporan anggota lama tetap harus bisa diakses.

## 3. Perubahan Jenis/Status Anggota Harus Tercatat

- Perubahan dari `BIASA` menjadi `LUAR_BIASA` harus tersimpan sebagai histori.
- Perubahan dari `AKTIF` menjadi `PASIF` juga harus tersimpan sebagai histori.
- Anggota yang keluar harus meninggalkan jejak perubahan status, bukan hanya overwrite di tabel `anggota`.
- Tabel `anggota` menyimpan kondisi terbaru.
- Tabel histori menyimpan perubahan-perubahan yang pernah terjadi.

## Tabel Tambahan Yang Dibuat

### `pengaturan_simpanan_anggota`

Fungsi:
- menyimpan nominal simpanan khusus per anggota
- menyimpan masa berlaku nominal
- menjadi prioritas utama saat generate tagihan simpanan wajib

Kolom inti:
- `anggota_id`
- `jenis_simpanan_id`
- `nama_pengaturan`
- `nominal`
- `berlaku_mulai`
- `berlaku_sampai`
- `aktif`

### `riwayat_keanggotaan`

Fungsi:
- mencatat perubahan jenis anggota
- mencatat perubahan status anggota
- mencatat kapan perubahan berlaku
- mencatat alasan perubahan dan petugas yang melakukan perubahan

Kolom inti:
- `anggota_id`
- `tanggal_perubahan`
- `jenis_anggota_lama`
- `jenis_anggota_baru`
- `status_anggota_lama`
- `status_anggota_baru`
- `tanggal_berlaku`
- `alasan_perubahan`
- `dibuat_oleh`

## Penyesuaian Tabel `anggota`

Kolom tambahan:
- `tanggal_perubahan_status_terakhir`
- `alasan_keluar_koperasi`
- `keterangan_status_anggota`

Tujuan:
- menyimpan snapshot status terkini yang cepat dibaca
- tetap selaras dengan histori di `riwayat_keanggotaan`

## Rekomendasi Logika Generate Simpanan Wajib

Urutan pengambilan nominal:
1. cek `pengaturan_simpanan_anggota`
2. jika tidak ada, cek `pengaturan_simpanan`
3. simpan nominal final ke `tagihan_simpanan`

Dengan model ini:
- nominal variabel per anggota tetap tertangani
- histori nominal aman
- histori perubahan keanggotaan juga aman
