UPDATE pejabat_ttd
SET jabatan_pejabat = UPPER(TRIM(jabatan_pejabat))
WHERE jabatan_pejabat IS NOT NULL
  AND jabatan_pejabat <> UPPER(TRIM(jabatan_pejabat));
