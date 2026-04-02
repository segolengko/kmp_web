# Function PostgreSQL Modul Simpanan

## Function Yang Tersedia

### 1. `fn_refresh_saldo_simpanan_anggota`

Untuk menghitung ulang ringkasan saldo simpanan per anggota dan per jenis simpanan.

Contoh:

```sql
SELECT fn_refresh_saldo_simpanan_anggota();
SELECT fn_refresh_saldo_simpanan_anggota(1, NULL);
SELECT fn_refresh_saldo_simpanan_anggota(1, 2);
```

### 2. `fn_generate_tagihan_wajib_bulanan`

Untuk membuat tagihan Simpanan Wajib per bulan bagi seluruh anggota yang belum keluar.

Contoh:

```sql
SELECT *
FROM fn_generate_tagihan_wajib_bulanan(DATE '2026-05-01', 'admin');
```

Hasil:
- `batch_id`
- `periode_tahun`
- `periode_bulan`
- `total_anggota`
- `total_tagihan_terbentuk`
- `status_batch`

### 3. `fn_bayar_tagihan_simpanan`

Untuk mencatat pembayaran simpanan bertagih dan otomatis mengalokasikan pembayaran ke tagihan tertua.

Contoh:

```sql
SELECT *
FROM fn_bayar_tagihan_simpanan(
    'AG0002',
    'SW',
    DATE '2026-05-05',
    100000.00,
    'TRANSFER',
    'Pembayaran simpanan wajib bulan berjalan.',
    'admin'
);
```

Catatan:
- function ini hanya untuk jenis simpanan dengan `model_pencatatan = 'TAGIHAN'`
- nominal bayar tidak boleh melebihi total tagihan terbuka
- setelah pembayaran berhasil, saldo ringkas akan diperbarui otomatis
