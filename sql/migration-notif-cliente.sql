
ALTER TABLE lv_visitas ADD COLUMN IF NOT EXISTS pais TEXT;
ALTER TABLE lv_visitas ADD COLUMN IF NOT EXISTS cidade TEXT;

CREATE TABLE IF NOT EXISTS lv_notificacoes_cliente (
  id TEXT PRIMARY KEY,
  conta_id TEXT,
  email TEXT,
  telefone TEXT,
  mensagem_id TEXT,
  titulo TEXT,
  corpo TEXT,
  tipo TEXT,
  estado TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  enviar_em TIMESTAMPTZ,
  enviada_em TIMESTAMPTZ,
  lida_em TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lv_ntf_cli_email ON lv_notificacoes_cliente (email);
CREATE INDEX IF NOT EXISTS idx_lv_ntf_cli_estado ON lv_notificacoes_cliente (estado);

ALTER TABLE lv_notificacoes_cliente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo ntf cliente" ON lv_notificacoes_cliente;
CREATE POLICY "Permitir tudo ntf cliente" ON lv_notificacoes_cliente FOR ALL USING (true) WITH CHECK (true);
