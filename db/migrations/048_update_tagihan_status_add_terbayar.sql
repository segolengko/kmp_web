ALTER TABLE IF EXISTS tagihan_project
DROP CONSTRAINT IF EXISTS ck_tagihan_project_status;

ALTER TABLE IF EXISTS tagihan_project
ADD CONSTRAINT ck_tagihan_project_status
CHECK (status_tagihan IN (
    'DRAFT',
    'DOKUMEN_SIAP',
    'TERKIRIM',
    'JPR_TERBIT',
    'MENUNGGU_CAIR',
    'TERBAYAR',
    'LUNAS',
    'CLOSED'
));

UPDATE tagihan_project
SET status_tagihan = 'TERBAYAR'
WHERE status_tagihan = 'LUNAS';
