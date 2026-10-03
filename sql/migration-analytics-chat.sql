-- Geo + mensagens chat
ALTER TABLE lv_visitas ADD COLUMN IF NOT EXISTS pais TEXT;
ALTER TABLE lv_visitas ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE lv_visitas ADD COLUMN IF NOT EXISTS conta_id TEXT;
ALTER TABLE lv_visitas ADD COLUMN IF NOT EXISTS conta_email TEXT;

CREATE TABLE IF NOT EXISTS lv_mensagens (
  id TEXT PRIMARY KEY,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  conta_id TEXT,
  mensagem TEXT NOT NULL,
  resposta TEXT,
  estado TEXT DEFAULT 'nova',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  respondido_em TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lv_msg_estado ON lv_mensagens (estado);
CREATE INDEX IF NOT EXISTS idx_lv_msg_created ON lv_mensagens (created_at DESC);

ALTER TABLE lv_mensagens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo mensagens" ON lv_mensagens;
CREATE POLICY "Permitir tudo mensagens" ON lv_mensagens FOR ALL USING (true) WITH CHECK (true);
