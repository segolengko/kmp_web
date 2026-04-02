# Catatan Migration 019

File:
- `019_create_function_proses_anggota_keluar.sql`

Function:
- `fn_proses_anggota_keluar(...)`

Tujuan:
- memproses anggota keluar dari koperasi
- mengubah status anggota menjadi `KELUAR`
- mengisi tanggal keluar
- mencatat histori ke `riwayat_keanggotaan`
- menghitung ringkasan simpanan yang dapat dikembalikan
- menghitung total tagihan terbuka
- menghitung nilai bersih pengembalian

## Asumsi Perhitungan

- Simpanan yang bisa dikembalikan dihitung dari `jenis_simpanan.bisa_ditarik = TRUE`
- `Simpanan Sukarela` memakai `saldo_tersedia`
- `Simpanan Wajib` dan `Simpanan Pokok` memakai `saldo_terbentuk`
- `Simpanan Penyertaan` tidak ikut pengembalian
- Tagihan terbuka dihitung dari semua tagihan dengan status:
  - `BELUM_BAYAR`
  - `SEBAGIAN`

## Rumus Nilai Bersih

```text
total_bersih_pengembalian =
    total_simpanan_dapat_ditarik - total_tagihan_terbuka
```

## Contoh Uji

Gunakan:
- `db/examples/009_proses_anggota_keluar.sql`
