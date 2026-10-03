
CREATE TABLE IF NOT EXISTS lv_verificacao (
  id TEXT PRIMARY KEY,
  destino TEXT,
  canal TEXT,
  finalidade TEXT,
  codigo TEXT,
  tentativas_validacao INT DEFAULT 0,
  usado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
ALTER TABLE lv_verificacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo verificacao" ON lv_verificacao;
CREATE POLICY "Permitir tudo verificacao" ON lv_verificacao FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE lv_mensagens ADD COLUMN IF NOT EXISTS conversa_id TEXT;
ALTER TABLE lv_mensagens ADD COLUMN IF NOT EXISTS pagina TEXT;
ALTER TABLE lv_mensagens ADD COLUMN IF NOT EXISTS pais TEXT;
CREATE INDEX IF NOT EXISTS idx_lv_msg_conversa ON lv_mensagens (conversa_id);

ALTER TABLE lv_contas_clientes ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT false;
ALTER TABLE lv_contas_clientes ADD COLUMN IF NOT EXISTS telefone_verificado BOOLEAN DEFAULT false;
ALTER TABLE lv_contas_clientes ADD COLUMN IF NOT EXISTS dial_code TEXT;
