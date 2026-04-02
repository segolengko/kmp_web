# Skema Modul Simpanan

## Tujuan

Dokumen ini merangkum struktur tabel inti untuk modul simpanan koperasi karyawan dan hubungan antar tabelnya.

## Tabel Inti

### 1. anggota

Menyimpan master anggota koperasi.

Kolom penting:
- `no_anggota`
- `nama_lengkap`
- `jenis_anggota`
- `status_anggota`
- `tanggal_masuk_koperasi`
- `tanggal_keluar_koperasi`

### 2. jenis_simpanan

Menyimpan master jenis simpanan dan aturan dasarnya.

Kolom penting:
- `kode`
- `nama`
- `kategori`
- `frekuensi`
- `model_pencatatan`
- `boleh_cicil`
- `bisa_ditarik`

Master awal:
- `SW` Simpanan Wajib
- `SP` Simpanan Pokok
- `SS` Simpanan Sukarela
- `SPN` Simpanan Penyertaan

### 3. pengaturan_simpanan

Menyimpan nominal aktif per jenis simpanan berdasarkan periode berlaku.

Kolom penting:
- `jenis_simpanan_id`
- `nominal`
- `berlaku_mulai`
- `berlaku_sampai`
- `aktif`

### 4. batch_generate_tagihan_simpanan

Mencatat proses generate tagihan bulanan.

Kolom penting:
- `kode_batch`
- `jenis_simpanan_id`
- `periode_tahun`
- `periode_bulan`
- `status_batch`

### 5. tagihan_simpanan

Menyimpan tagihan untuk simpanan yang bertipe tagihan.

Dipakai untuk:
- Simpanan Wajib
- Simpanan Pokok
- Simpanan Penyertaan

Kolom penting:
- `no_tagihan`
- `anggota_id`
- `jenis_simpanan_id`
- `periode_label`
- `nominal_tagihan`
- `nominal_terbayar`
- `status_tagihan`
- `batch_generate_tagihan_simpanan_id`

### 6. transaksi_simpanan

Menyimpan transaksi uang masuk atau keluar.

Kolom penting:
- `no_transaksi`
- `tanggal_transaksi`
- `anggota_id`
- `jenis_simpanan_id`
- `model_transaksi`
- `tipe_transaksi`
- `metode_bayar`
- `nominal`

### 7. alokasi_pembayaran_simpanan

Menghubungkan satu transaksi pembayaran dengan satu atau beberapa tagihan.

Fungsi:
- pembayaran 1 transaksi bisa melunasi beberapa bulan tunggakan
- pembayaran sebagian bisa tercatat rapi

### 8. penarikan_simpanan

Menyimpan pengajuan dan realisasi penarikan simpanan.

Dipakai untuk:
- simpanan sukarela
- pengembalian simpanan wajib saat keluar
- pengembalian simpanan pokok saat keluar

### 9. saldo_simpanan_anggota

Menyimpan ringkasan saldo per anggota dan per jenis simpanan.

Kolom penting:
- `saldo_terbentuk`
- `saldo_ditahan`
- `saldo_tersedia`
- `total_setor`
- `total_tarik`
- `total_tagihan`
- `total_tunggakan`

## View Operasional

### v_tunggakan_simpanan_wajib

View ini menampilkan tagihan Simpanan Wajib yang sudah melewati jatuh tempo dan belum lunas.

Manfaat:
- daftar tunggakan per anggota
- dasar dashboard tunggakan
- dasar modul penagihan

## Relasi Utama

- `anggota` 1 ke banyak `tagihan_simpanan`
- `anggota` 1 ke banyak `transaksi_simpanan`
- `anggota` 1 ke banyak `penarikan_simpanan`
- `jenis_simpanan` 1 ke banyak `pengaturan_simpanan`
- `jenis_simpanan` 1 ke banyak `tagihan_simpanan`
- `jenis_simpanan` 1 ke banyak `transaksi_simpanan`
- `batch_generate_tagihan_simpanan` 1 ke banyak `tagihan_simpanan`
- `transaksi_simpanan` 1 ke banyak `alokasi_pembayaran_simpanan`
- `tagihan_simpanan` 1 ke banyak `alokasi_pembayaran_simpanan`

## Aturan Bisnis Yang Sudah Tetap

- Simpanan Wajib ditagih bulanan selama anggota belum keluar.
- Simpanan Pokok ditagih sekali.
- Simpanan Penyertaan ditagih sekali dan dapat dicicil.
- Simpanan Sukarela dicatat sebagai transaksi langsung.
- Simpanan Wajib, Simpanan Pokok, dan Simpanan Sukarela dapat diperhitungkan saat anggota keluar.
- Simpanan Penyertaan tidak dapat ditarik.
