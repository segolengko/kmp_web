# Catatan Migration 022

File:
- `022_create_function_proses_anggota_keluar_lengkap.sql`

Function:
- `fn_proses_anggota_keluar_lengkap(...)`

Tujuan:
- mempermudah operasional anggota keluar dalam satu langkah
- mengubah status anggota menjadi `KELUAR`
- mencatat histori keanggotaan
- menghitung ringkasan pengembalian simpanan
- membuat draft penarikan simpanan otomatis

## Alur Internal

Function ini memanggil:
1. `fn_proses_anggota_keluar(...)`
2. `fn_buat_draft_penarikan_keluar(...)`

## Hasil Yang Dikembalikan

- `anggota_id`
- `riwayat_id`
- `total_simpanan_dapat_ditarik`
- `total_tagihan_terbuka`
- `total_bersih_pengembalian`
- `total_draft_terbentuk`
- `total_nominal_pengajuan`

## Contoh Uji

Gunakan:
- `db/examples/012_proses_anggota_keluar_lengkap.sql`
