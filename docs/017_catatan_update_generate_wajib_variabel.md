# Catatan Migration 017

File:
- `017_update_function_generate_tagihan_wajib_variabel_per_anggota.sql`

Tujuan:
- mengubah function `fn_generate_tagihan_wajib_bulanan`
- agar nominal simpanan wajib bisa dibaca per anggota

Urutan logika nominal:
1. cek `pengaturan_simpanan_anggota`
2. jika tidak ada, fallback ke `pengaturan_simpanan`
3. jika keduanya tidak ada, anggota tersebut tidak dibuatkan tagihan untuk periode itu

Catatan hasil generate:
- `batch_generate_tagihan_simpanan.catatan` akan memberi info kalau ada anggota aktif yang belum punya nominal
- `tagihan_simpanan.keterangan` akan menyimpan sumber nominal:
  - `PENGATURAN_ANGGOTA`
  - `PENGATURAN_UMUM`

File ini aman dijalankan setelah:
- `014_create_table_pengaturan_simpanan_anggota.sql`
- `015_create_table_riwayat_keanggotaan.sql`
- `016_add_metadata_status_keluar_to_anggota.sql`
