# Catatan Migration 018

File:
- `018_create_function_update_keanggotaan.sql`

Function:
- `fn_update_keanggotaan_anggota(...)`

Tujuan:
- mengubah `jenis_anggota`
- mengubah `status_anggota`
- mengisi `tanggal_keluar_koperasi` jika anggota keluar
- mencatat histori ke `riwayat_keanggotaan`

## Contoh Pemakaian

### 1. Anggota biasa menjadi luar biasa dan pasif

```sql
SELECT *
FROM fn_update_keanggotaan_anggota(
    'AG0002',
    'LUAR_BIASA',
    'PASIF',
    DATE '2026-04-01',
    NULL,
    'Perubahan status keanggotaan sesuai keputusan pengurus.',
    'Anggota tidak lagi aktif sebagai karyawan tetap.',
    'admin'
);
```

### 2. Anggota keluar dari koperasi

```sql
SELECT *
FROM fn_update_keanggotaan_anggota(
    'AG0010',
    NULL,
    'KELUAR',
    DATE '2026-04-01',
    DATE '2026-04-01',
    'Mengajukan keluar dari koperasi.',
    'Pengembalian simpanan diproses terpisah.',
    'admin'
);
```

## Catatan

- Jika `jenis_anggota_baru` tidak diisi, function akan memakai jenis saat ini.
- Jika `status_anggota_baru` tidak diisi, function akan memakai status saat ini.
- Jika status akhir `KELUAR`, maka `tanggal_keluar_koperasi` akan diisi dari:
  1. `p_tanggal_keluar_koperasi`
  2. atau fallback ke `p_tanggal_berlaku`
- Jika tidak ada perubahan sama sekali, function akan melempar error.
