# Function PostgreSQL Lanjutan Modul Simpanan

## Function Yang Ditambahkan

### 1. `fn_buat_tagihan_awal_anggota`

Untuk membuat tagihan awal anggota baru:
- `Simpanan Pokok`
- `Simpanan Penyertaan`

Contoh:

```sql
SELECT *
FROM fn_buat_tagihan_awal_anggota(
    'AG0003',
    DATE '2026-03-01',
    'admin'
);
```

Hasil:
- `anggota_id`
- `total_tagihan_terbentuk`

### 2. `fn_catat_transaksi_simpanan_langsung`

Untuk mencatat transaksi simpanan yang tidak melalui tagihan, misalnya `Simpanan Sukarela`.

Contoh setor:

```sql
SELECT *
FROM fn_catat_transaksi_simpanan_langsung(
    'AG0001',
    'SS',
    DATE '2026-04-06',
    'SETOR',
    250000.00,
    'TUNAI',
    'Setoran simpanan sukarela.',
    'admin'
);
```

Contoh tarik:

```sql
SELECT *
FROM fn_catat_transaksi_simpanan_langsung(
    'AG0001',
    'SS',
    DATE '2026-04-10',
    'TARIK',
    100000.00,
    'TUNAI',
    'Penarikan simpanan sukarela.',
    'admin'
);
```

Catatan:
- function ini hanya untuk `jenis_simpanan` dengan `model_pencatatan = 'TRANSAKSI_LANGSUNG'`
- untuk transaksi tarik, saldo tersedia harus cukup
