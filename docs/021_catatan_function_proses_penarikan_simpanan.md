# Catatan Migration 021

File:
- `021_create_function_proses_penarikan_simpanan.sql`

Function:
- `fn_proses_penarikan_simpanan(...)`

Tujuan:
- memproses draft penarikan simpanan
- mendukung status:
  - `DISETUJUI`
  - `DITOLAK`
  - `DIBATALKAN`
  - `DIREALISASIKAN`

## Alur

1. Draft dibuat lebih dulu melalui:
   - `fn_buat_draft_penarikan_keluar(...)`
2. Draft disetujui atau ditolak
3. Jika disetujui, draft dapat direalisasikan
4. Saat direalisasikan, function akan membuat `transaksi_simpanan` tipe `TARIK`
5. Saldo simpanan anggota akan di-refresh kembali

## Aturan Status

- `DISETUJUI` hanya dari `DIAJUKAN`
- `DITOLAK` atau `DIBATALKAN` hanya dari `DIAJUKAN` atau `DISETUJUI`
- `DIREALISASIKAN` hanya dari `DISETUJUI`

## Contoh Uji

Gunakan:
- `db/examples/011_proses_penarikan_simpanan.sql`
