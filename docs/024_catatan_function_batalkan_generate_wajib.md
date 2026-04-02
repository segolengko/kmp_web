# Catatan Function Batalkan Generate Wajib

Function:
- `fn_batalkan_generate_wajib(p_batch_id, p_dibatalkan_oleh, p_catatan)`

Tujuan:
- membatalkan satu batch generate simpanan wajib secara aman
- menghapus tagihan hasil batch
- menghapus alokasi pembayaran otomatis hasil batch
- menghapus transaksi auto lunas hasil batch
- refresh saldo agar angka kembali konsisten

## Syarat aman pembatalan

Batch hanya bisa dibatalkan jika:
- batch adalah untuk jenis simpanan `SW`
- batch belum berstatus `DIBATALKAN`
- tagihan dalam batch belum mengandung pembayaran manual
- transaksi yang terkait batch hanya transaksi otomatis dari generate
- tidak ada tagihan batch berstatus parsial/dibatalkan yang perlu intervensi manual

## Dampak pembatalan

Function akan:
1. hapus alokasi pembayaran batch
2. hapus transaksi otomatis batch
3. hapus tagihan batch
4. ubah status batch menjadi `DIBATALKAN`
5. refresh saldo simpanan anggota

## Catatan operasional

Function ini aman untuk koreksi trial atau koreksi batch yang belum disentuh proses manual.

Jika sudah ada pembayaran manual pada tagihan batch:
- function akan menolak
- koreksi harus dilakukan manual dan terkontrol
