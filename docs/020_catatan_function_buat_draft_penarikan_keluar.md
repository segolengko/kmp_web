# Catatan Migration 020

File:
- `020_create_function_buat_draft_penarikan_keluar.sql`

Function:
- `fn_buat_draft_penarikan_keluar(...)`

Tujuan:
- membuat draft `penarikan_simpanan` untuk anggota yang sudah berstatus `KELUAR`
- nominal draft diambil dari saldo simpanan yang memang boleh ditarik

## Aturan

- hanya bisa dijalankan untuk anggota dengan status `KELUAR`
- hanya membuat draft untuk `jenis_simpanan.bisa_ditarik = TRUE`
- `Simpanan Sukarela` memakai `saldo_tersedia`
- `Simpanan Wajib` dan `Simpanan Pokok` memakai `saldo_terbentuk`
- tidak membuat draft ganda jika untuk jenis simpanan yang sama masih ada draft:
  - `DIAJUKAN`
  - `DISETUJUI`

## Contoh Uji

Gunakan:
- `db/examples/010_buat_draft_penarikan_keluar.sql`
