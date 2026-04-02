# Standarisasi UI Modul KMP

Dokumen ini jadi acuan visual dan ritme interaksi untuk seluruh modul admin KMP.

## Prinsip Umum

- Fokus utama adalah kecepatan kerja admin, bukan tampilan marketing.
- Gunakan font yang rapat dan nyaman baca, jangan terlalu besar.
- Jadikan tabel, filter, dan aksi operasional sebagai pusat layar.
- Hindari card besar berlapis jika informasi bisa ditampilkan lebih padat.
- Konsistenkan pola antar modul agar admin tidak perlu belajar ulang.

## Shell Aplikasi

- Gunakan `OpsShell` dengan top navigation, tanpa sidebar.
- Header modul selalu berisi:
  - badge kecil
  - judul halaman
  - deskripsi singkat 1 kalimat
  - optional tombol aksi utama
- Quick actions ditempatkan di top bar, bukan panel samping.

## Tipografi

- Judul halaman: ukuran sedang, bukan hero text.
- Judul section: ringkas dan tegas.
- Label field dan teks tabel memakai ukuran kecil-menengah.
- Deskripsi dan helper text harus tetap terbaca, tapi tidak dominan.

## Pola Per Modul

### 1. Master Data

- Susunan: header -> filter bar -> summary kecil -> tabel -> pagination.
- Aksi per baris: `Detail`, `Edit`, `Hapus`.
- Aksi utama: `Tambah`, `Import`, `Export`.

### 2. Form Master

- Gunakan `managementCard` + `managementForm`.
- Maksimal 2-3 kolom per baris.
- Field panjang pakai `fieldFull`.
- Pesan sukses/gagal selalu tampil di atas tombol simpan.

### 3. Transaksi Operasional

- Susunan: form input -> summary ringkas -> tabel riwayat/tagihan.
- Lookup anggota wajib pakai search picker.
- Tombol submit harus jelas, tunggal, dan dekat dengan form.

### 4. Batch Process

- Susunan: parameter proses -> hasil terakhir -> histori batch.
- Angka ringkasan kecil ditempatkan dalam summary strip.
- Status batch pakai badge konsisten.

### 5. Laporan

- Susunan: filter periode/tahun -> summary -> tabel utama -> drilldown.
- Laporan lebar harus mengutamakan area tabel.
- Detail anggota pakai section audit trail yang konsisten.

## Komponen Bersama

- `OpsShell` untuk shell modul
- `DarkSelect` untuk dropdown custom
- `managementCard` untuk panel modul
- `managementForm` untuk layout form
- `filterBar` / `filterBarCompact` untuk toolbar filter
- `summaryTile` untuk ringkasan angka
- `statusChip` untuk status operasional
- `table` + `tableWrap` untuk data grid

## Status Warna

- Sukses / Aktif / Lunas: teal
- Peringatan / Pasif / Sebagian: amber
- Error / Keluar / Belum Bayar: rose

## Catatan Migrasi

- Tailwind dipakai bertahap untuk shell dan halaman utama.
- CSS Modules tetap boleh dipakai untuk shared class yang belum dimigrasikan.
- Prioritas migrasi berikutnya:
  1. Pembayaran Simpanan
  2. Laporan
  3. Generate Wajib
  4. Master Data lainnya
