# Alur Proses Simpanan Koperasi Karyawan

## Ringkasan Jenis Simpanan

| Jenis Simpanan | Cara Pencatatan | Cara Tagih | Bisa Dicicil | Bisa Ditarik |
| --- | --- | --- | --- | --- |
| Simpanan Wajib | Tagihan | Bulanan | Ya, melalui pelunasan tagihan bertahap | Ya, saat anggota keluar |
| Simpanan Pokok | Tagihan | Sekali | Tidak pada aturan awal | Ya, saat anggota keluar |
| Simpanan Sukarela | Transaksi langsung | Tidak ditagih | Tidak relevan | Ya |
| Simpanan Penyertaan | Tagihan | Sekali | Ya | Tidak |

## Tabel Yang Digunakan

- `anggota`
- `jenis_simpanan`
- `pengaturan_simpanan`
- `batch_generate_tagihan_simpanan`
- `tagihan_simpanan`
- `transaksi_simpanan`
- `alokasi_pembayaran_simpanan`
- `penarikan_simpanan`
- `saldo_simpanan_anggota`

## Alur 1 - Anggota Baru

1. Admin membuat data anggota.
2. Sistem membuat saldo awal simpanan per anggota.
3. Sistem membuat tagihan sekali untuk Simpanan Pokok.
4. Sistem membuat tagihan sekali untuk Simpanan Penyertaan jika diwajibkan.
5. Anggota mulai ikut generate Simpanan Wajib sesuai periode berlaku koperasi.

## Alur 2 - Generate Simpanan Wajib Bulanan

1. Admin menjalankan proses generate tagihan bulanan.
2. Sistem membuat record batch pada `batch_generate_tagihan_simpanan`.
3. Sistem membaca nominal aktif dari `pengaturan_simpanan`.
4. Sistem membuat `tagihan_simpanan` untuk anggota yang belum keluar.
5. Sistem menandai batch sebagai selesai setelah tagihan terbentuk.

Catatan:
- Satu batch hanya berlaku untuk satu jenis simpanan dan satu periode.
- Tagihan bulan yang sama tidak boleh tergenerate dobel.

## Alur 3 - Pembayaran Simpanan Wajib

1. Petugas mencatat pembayaran pada `transaksi_simpanan`.
2. Sistem mencari tagihan wajib tertua yang belum lunas.
3. Sistem mengalokasikan pembayaran ke satu atau beberapa tagihan melalui `alokasi_pembayaran_simpanan`.
4. Sistem memperbarui `nominal_terbayar` dan `status_tagihan`.
5. Sistem memperbarui ringkasan di `saldo_simpanan_anggota`.

Catatan:
- Pembayaran 1 tahun langsung tetap dicatat sebagai satu transaksi.
- Sistem mengalokasikan transaksi itu ke 12 tagihan bulanan.

## Alur 4 - Pembayaran Simpanan Pokok

1. Saat anggota masuk, sistem membuat satu tagihan Simpanan Pokok.
2. Petugas mencatat pembayaran.
3. Sistem mengalokasikan pembayaran ke tagihan pokok.
4. Tagihan berstatus `SEBAGIAN` atau `LUNAS`.

## Alur 5 - Pembayaran Simpanan Penyertaan

1. Sistem membuat satu tagihan Simpanan Penyertaan.
2. Anggota dapat membayar bertahap.
3. Setiap pembayaran dicatat di `transaksi_simpanan`.
4. Sistem mengalokasikan pembayaran ke tagihan penyertaan sampai lunas.

## Alur 6 - Simpanan Sukarela

1. Anggota setor atau tarik dana.
2. Petugas mencatat transaksi langsung pada `transaksi_simpanan`.
3. Sistem menambah atau mengurangi saldo anggota.

Catatan:
- Simpanan sukarela tidak membuat tagihan.
- Simpanan sukarela tidak memiliki tunggakan.

## Alur 7 - Penarikan Simpanan

1. Petugas membuat pengajuan pada `penarikan_simpanan`.
2. Pengurus atau admin menyetujui atau menolak.
3. Setelah direalisasikan, sistem membuat transaksi keluar dan memperbarui saldo.

Aturan penarikan:
- Simpanan Wajib dapat dihitung untuk pengembalian saat anggota keluar.
- Simpanan Pokok dapat dihitung untuk pengembalian saat anggota keluar.
- Simpanan Sukarela dapat ditarik.
- Simpanan Penyertaan tidak dapat ditarik.

## Alur 8 - Anggota Keluar

1. Status anggota diubah menjadi keluar.
2. Generate Simpanan Wajib dihentikan.
3. Sistem menghitung tunggakan terakhir.
4. Sistem menghitung hak pengembalian simpanan yang boleh ditarik.
5. Koperasi dapat melakukan kompensasi antara hak pengembalian dan tunggakan.

## Aturan Penting

- Tunggakan dihitung dari tagihan yang belum lunas dan sudah lewat jatuh tempo.
- Simpanan Wajib tetap bulanan walaupun dibayar sekaligus 1 tahun.
- Simpanan Pokok dan Simpanan Penyertaan tetap berupa tagihan sekali.
- Simpanan Sukarela dicatat sebagai saldo berjalan.
