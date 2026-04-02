# SOP Anggota Luar Biasa Pasif

## Tujuan
Menetapkan prosedur operasional simpanan wajib untuk anggota `LUAR_BIASA` dengan status `PASIF`, agar proses generate, penagihan, pembayaran, dan monitoring tunggakan berjalan konsisten dan mudah diaudit.

## Ruang Lingkup
SOP ini berlaku untuk anggota koperasi yang:
- `jenis_anggota = LUAR_BIASA`
- `status_anggota = PASIF`
- tidak lagi memiliki payroll aktif
- melakukan pembayaran simpanan wajib secara mandiri

## Karakteristik Operasional
- tetap ikut generate simpanan wajib bulanan
- tagihan yang terbentuk tidak auto lunas
- pembayaran dilakukan manual
- anggota dapat membayar:
  - 1 bulan
  - beberapa bulan sekaligus
  - tunggakan lama
- anggota yang belum membayar tetap tercatat memiliki tunggakan

## Aturan Utama
1. Anggota `LUAR_BIASA + PASIF` tetap ikut generate simpanan wajib bulanan.
2. Tagihan hasil generate berstatus awal `BELUM_BAYAR`.
3. Pembayaran dilakukan manual melalui modul pembayaran simpanan.
4. Sistem mengalokasikan pembayaran ke tagihan terbuka paling lama terlebih dahulu.
5. Pembayaran dapat menutup satu atau beberapa bulan sesuai nominal yang dibayar.
6. Jika nominal tidak cukup menutup satu tagihan penuh, status tagihan menjadi `SEBAGIAN`.
7. Jika anggota tidak melakukan pembayaran, tagihan tetap menjadi tunggakan aktif.

## Prosedur Operasional

### 1. Persiapan Data Anggota
Pastikan data anggota sudah benar:
- `jenis_anggota = LUAR_BIASA`
- `status_anggota = PASIF`
- anggota tidak berstatus `KELUAR`

### 2. Persiapan Pengaturan Simpanan
Di master `Pengaturan Simpanan`, pastikan tersedia pengaturan aktif untuk:
- `Jenis Simpanan = SW`
- `Segmen Anggota = LUAR_BIASA_PASIF`
- periode berlaku sesuai bulan generate

### 3. Generate Bulanan
Setiap awal periode:
- admin menjalankan `Generate Wajib`
- sistem membuat tagihan simpanan wajib untuk anggota `LUAR_BIASA + PASIF`
- status tagihan awal adalah `BELUM_BAYAR`

### 4. Penerimaan Pembayaran
Jika anggota datang membayar:
- buka modul `Pembayaran Simpanan`
- pilih anggota
- pilih `Simpanan Wajib`
- input nominal sesuai uang/setoran yang diterima
- simpan transaksi

Sistem akan:
- mengalokasikan pembayaran ke tagihan yang paling lama
- memperbarui nominal terbayar
- memperbarui status tagihan menjadi `SEBAGIAN` atau `LUNAS`

### 5. Pembayaran Beberapa Bulan Sekaligus
Jika anggota membayar beberapa bulan sekaligus:
- admin cukup input total nominal pembayaran
- sistem otomatis mengalokasikan ke tagihan paling lama sampai nominal habis

### 6. Monitoring Tunggakan
Admin memantau secara berkala:
- daftar anggota `LUAR_BIASA + PASIF`
- jumlah tagihan terbuka
- umur tunggakan
- total nominal tunggakan

### 7. Perubahan Status Keanggotaan
Jika status anggota berubah menjadi:
- `AKTIF`
- `KELUAR`
- atau ada perubahan jenis/status lain

maka admin wajib:
- memperbarui data keanggotaan terlebih dahulu
- generate periode berikutnya akan mengikuti segmen baru anggota

## Kontrol dan Validasi
- generate tidak boleh dilakukan ganda untuk periode yang sama
- tagihan yang sudah memiliki pembayaran tidak boleh dihapus sembarangan
- perubahan nominal periode lama tidak boleh dilakukan langsung pada tagihan
- seluruh pembayaran harus memiliki transaksi pendukung

## Larangan
- tidak boleh menandai tagihan lunas tanpa transaksi
- tidak boleh menghapus tagihan yang sudah dialokasikan ke pembayaran
- tidak boleh mengubah riwayat tunggakan tanpa dasar transaksi

## Ringkasan Kebijakan
- `LUAR_BIASA + PASIF` = generate bulanan + bayar manual
- boleh bayar fleksibel
- tunggakan tetap tercatat jika belum dibayar
- sistem mengalokasikan pembayaran ke tagihan tertua terlebih dahulu
