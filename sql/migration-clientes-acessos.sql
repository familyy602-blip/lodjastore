-- Acessos e visitas por conta
ALTER TABLE lv_contas_clientes ADD COLUMN IF NOT EXISTS acessos INT DEFAULT 0;
ALTER TABLE lv_contas_clientes ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMPTZ;

ALTER TABLE lv_visitas ADD COLUMN IF NOT EXISTS conta_id TEXT;
ALTER TABLE lv_visitas ADD COLUMN IF NOT EXISTS conta_email TEXT;
CREATE INDEX IF NOT EXISTS idx_lv_visitas_conta ON lv_visitas (conta_id);
