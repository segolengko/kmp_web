INSERT INTO saldo_simpanan_anggota (
    anggota_id,
    jenis_simpanan_id,
    saldo_terbentuk,
    saldo_ditahan,
    saldo_tersedia,
    total_setor,
    total_tarik,
    total_tagihan,
    total_tunggakan,
    terakhir_dihitung_at
)
SELECT
    a.id,
    js.id,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    CURRENT_TIMESTAMP
FROM anggota a
CROSS JOIN jenis_simpanan js
WHERE NOT EXISTS (
    SELECT 1
    FROM saldo_simpanan_anggota ssa
    WHERE ssa.anggota_id = a.id
      AND ssa.jenis_simpanan_id = js.id
);
