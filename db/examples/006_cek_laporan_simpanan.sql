SELECT
    a.no_anggota,
    a.nama_lengkap,
    js.kode AS kode_simpanan,
    js.nama AS nama_simpanan,
    ssa.saldo_terbentuk,
    ssa.saldo_ditahan,
    ssa.saldo_tersedia,
    ssa.total_setor,
    ssa.total_tarik,
    ssa.total_tagihan,
    ssa.total_tunggakan,
    ssa.terakhir_dihitung_at
FROM saldo_simpanan_anggota ssa
JOIN anggota a ON a.id = ssa.anggota_id
JOIN jenis_simpanan js ON js.id = ssa.jenis_simpanan_id
ORDER BY a.no_anggota, js.kode;

SELECT
    no_anggota,
    nama_lengkap,
    periode_label,
    nominal_tagihan,
    nominal_terbayar,
    sisa_tunggakan,
    umur_tunggakan_hari
FROM v_tunggakan_simpanan_wajib
ORDER BY no_anggota, periode_tahun, periode_bulan;
