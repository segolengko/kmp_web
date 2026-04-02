export type AnggotaItem = {
  noAnggota: string;
  namaLengkap: string;
  jenisKelamin?: "LAKI_LAKI" | "PEREMPUAN";
  jenisAnggota: "BIASA" | "LUAR_BIASA";
  statusAnggota: "AKTIF" | "PASIF" | "KELUAR";
  departemen: string;
  jabatan: string;
  noHp: string;
  tanggalMasukKoperasi: string;
  fotoUrl?: string | null;
  fotoStorageKey?: string | null;
  nik?: string | null;
  email?: string | null;
  alamat?: string | null;
  tanggalMasukKerja?: string | null;
  catatan?: string | null;
};

export const mockAnggota: AnggotaItem[] = [
  { noAnggota: "AG0001", namaLengkap: "Andi Pratama", jenisKelamin: "LAKI_LAKI", jenisAnggota: "BIASA", statusAnggota: "AKTIF", departemen: "Finance", jabatan: "Staff", noHp: "081200000001", tanggalMasukKoperasi: "2026-01-15", nik: "3174000101010001", email: "andi.pratama@example.com", alamat: "Jl. Melati No. 1, Jakarta", tanggalMasukKerja: "2020-02-01", fotoUrl: null },
  { noAnggota: "AG0002", namaLengkap: "Budi Santoso", jenisKelamin: "LAKI_LAKI", jenisAnggota: "LUAR_BIASA", statusAnggota: "PASIF", departemen: "Operasional", jabatan: "Supervisor", noHp: "081200000002", tanggalMasukKoperasi: "2025-06-10", nik: "3174000101010002", email: "budi.santoso@example.com", alamat: "Jl. Kenanga No. 2, Bandung", tanggalMasukKerja: "2018-06-01", fotoUrl: null },
  { noAnggota: "AG0003", namaLengkap: "Citra Lestari", jenisKelamin: "PEREMPUAN", jenisAnggota: "BIASA", statusAnggota: "AKTIF", departemen: "HR", jabatan: "Officer", noHp: "081200000003", tanggalMasukKoperasi: "2026-03-01", nik: "3174000101010003", email: "citra.lestari@example.com", alamat: "Jl. Mawar No. 3, Semarang", tanggalMasukKerja: "2021-08-01", fotoUrl: null },
  { noAnggota: "AG0004", namaLengkap: "Dewi Maharani", jenisKelamin: "PEREMPUAN", jenisAnggota: "BIASA", statusAnggota: "AKTIF", departemen: "Legal", jabatan: "Staff", noHp: "081200000004", tanggalMasukKoperasi: "2025-11-19", nik: "3174000101010004", email: "dewi.maharani@example.com", alamat: "Jakarta Selatan", tanggalMasukKerja: "2020-09-14", fotoUrl: null },
  { noAnggota: "AG0005", namaLengkap: "Eka Saputra", jenisKelamin: "LAKI_LAKI", jenisAnggota: "LUAR_BIASA", statusAnggota: "PASIF", departemen: "Engineering", jabatan: "Analyst", noHp: "081200000005", tanggalMasukKoperasi: "2024-08-12", nik: "3174000101010005", email: "eka.saputra@example.com", alamat: "Bekasi", tanggalMasukKerja: "2019-04-10", fotoUrl: null },
  { noAnggota: "AG0006", namaLengkap: "Fajar Nugroho", jenisKelamin: "LAKI_LAKI", jenisAnggota: "BIASA", statusAnggota: "AKTIF", departemen: "Purchasing", jabatan: "Coordinator", noHp: "081200000006", tanggalMasukKoperasi: "2025-01-08", nik: "3174000101010006", email: "fajar.nugroho@example.com", alamat: "Depok", tanggalMasukKerja: "2021-03-09", fotoUrl: null },
  { noAnggota: "AG0007", namaLengkap: "Gita Permata", jenisKelamin: "PEREMPUAN", jenisAnggota: "BIASA", statusAnggota: "AKTIF", departemen: "Finance", jabatan: "Analyst", noHp: "081200000007", tanggalMasukKoperasi: "2023-12-03", nik: "3174000101010007", email: "gita.permata@example.com", alamat: "Bogor", tanggalMasukKerja: "2020-12-01", fotoUrl: null },
  { noAnggota: "AG0008", namaLengkap: "Hendra Wijaya", jenisKelamin: "LAKI_LAKI", jenisAnggota: "LUAR_BIASA", statusAnggota: "PASIF", departemen: "Logistik", jabatan: "Staff", noHp: "081200000008", tanggalMasukKoperasi: "2022-05-16", nik: "3174000101010008", email: "hendra.wijaya@example.com", alamat: "Tangerang", tanggalMasukKerja: "2017-11-01", fotoUrl: null },
  { noAnggota: "AG0009", namaLengkap: "Intan Puspita", jenisKelamin: "PEREMPUAN", jenisAnggota: "BIASA", statusAnggota: "AKTIF", departemen: "Marketing", jabatan: "Executive", noHp: "081200000009", tanggalMasukKoperasi: "2025-07-01", nik: "3174000101010009", email: "intan.puspita@example.com", alamat: "Jakarta Barat", tanggalMasukKerja: "2022-01-17", fotoUrl: null },
  { noAnggota: "AG0010", namaLengkap: "Joko Susilo", jenisKelamin: "LAKI_LAKI", jenisAnggota: "BIASA", statusAnggota: "KELUAR", departemen: "Operasional", jabatan: "Staff", noHp: "081200000010", tanggalMasukKoperasi: "2021-02-14", nik: "3174000101010010", email: "joko.susilo@example.com", alamat: "Cikarang", tanggalMasukKerja: "2016-05-20", fotoUrl: null },
  { noAnggota: "AG0011", namaLengkap: "Kartika Sari", jenisKelamin: "PEREMPUAN", jenisAnggota: "BIASA", statusAnggota: "AKTIF", departemen: "IT Support", jabatan: "Officer", noHp: "081200000011", tanggalMasukKoperasi: "2026-02-10", nik: "3174000101010011", email: "kartika.sari@example.com", alamat: "Jakarta Timur", tanggalMasukKerja: "2021-06-06", fotoUrl: null },
  { noAnggota: "AG0012", namaLengkap: "Lukman Hakim", jenisKelamin: "LAKI_LAKI", jenisAnggota: "LUAR_BIASA", statusAnggota: "PASIF", departemen: "Engineering", jabatan: "Supervisor", noHp: "081200000012", tanggalMasukKoperasi: "2023-09-27", nik: "3174000101010012", email: "lukman.hakim@example.com", alamat: "Bandung", tanggalMasukKerja: "2018-02-14", fotoUrl: null },
  { noAnggota: "AG0013", namaLengkap: "Maya Savitri", jenisKelamin: "PEREMPUAN", jenisAnggota: "BIASA", statusAnggota: "AKTIF", departemen: "HR", jabatan: "Manager", noHp: "081200000013", tanggalMasukKoperasi: "2024-10-04", nik: "3174000101010013", email: "maya.savitri@example.com", alamat: "Jakarta Selatan", tanggalMasukKerja: "2019-07-23", fotoUrl: null },
  { noAnggota: "AG0014", namaLengkap: "Nanda Prakoso", jenisKelamin: "LAKI_LAKI", jenisAnggota: "BIASA", statusAnggota: "AKTIF", departemen: "General Affairs", jabatan: "Staff", noHp: "081200000014", tanggalMasukKoperasi: "2026-01-20", nik: "3174000101010014", email: "nanda.prakoso@example.com", alamat: "Depok", tanggalMasukKerja: "2023-01-01", fotoUrl: null },
  { noAnggota: "AG0015", namaLengkap: "Olivia Rahma", jenisKelamin: "PEREMPUAN", jenisAnggota: "LUAR_BIASA", statusAnggota: "PASIF", departemen: "Marketing", jabatan: "Consultant", noHp: "081200000015", tanggalMasukKoperasi: "2025-03-15", nik: "3174000101010015", email: "olivia.rahma@example.com", alamat: "Tangerang Selatan", tanggalMasukKerja: "2020-05-01", fotoUrl: null },
  { noAnggota: "AG0016", namaLengkap: "Putra Hidayat", jenisKelamin: "LAKI_LAKI", jenisAnggota: "BIASA", statusAnggota: "AKTIF", departemen: "Finance", jabatan: "Controller", noHp: "081200000016", tanggalMasukKoperasi: "2024-04-11", nik: "3174000101010016", email: "putra.hidayat@example.com", alamat: "Bogor", tanggalMasukKerja: "2018-10-12", fotoUrl: null },
  { noAnggota: "AG0017", namaLengkap: "Qori Ananda", jenisKelamin: "PEREMPUAN", jenisAnggota: "BIASA", statusAnggota: "AKTIF", departemen: "Procurement", jabatan: "Staff", noHp: "081200000017", tanggalMasukKoperasi: "2024-12-09", nik: "3174000101010017", email: "qori.ananda@example.com", alamat: "Bekasi", tanggalMasukKerja: "2022-09-19", fotoUrl: null },
  { noAnggota: "AG0018", namaLengkap: "Rizky Mahendra", jenisKelamin: "LAKI_LAKI", jenisAnggota: "LUAR_BIASA", statusAnggota: "PASIF", departemen: "Logistik", jabatan: "Coordinator", noHp: "081200000018", tanggalMasukKoperasi: "2022-07-23", nik: "3174000101010018", email: "rizky.mahendra@example.com", alamat: "Cibubur", tanggalMasukKerja: "2017-01-09", fotoUrl: null }
];
