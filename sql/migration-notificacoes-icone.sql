-- Execute no SQL Editor do Supabase (mesmo projecto LODJA)
ALTER TABLE lv_categorias ADD COLUMN IF NOT EXISTS icone TEXT;

CREATE TABLE IF NOT EXISTS lv_notificacoes (
  id TEXT PRIMARY KEY,
  tipo TEXT DEFAULT 'info',
  titulo TEXT NOT NULL,
  mensagem TEXT,
  ref_id TEXT,
  ref_tipo TEXT,
  lida BOOLEAN DEFAULT false,
  data_criacao TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lv_notif_lida ON lv_notificacoes (lida);
CREATE INDEX IF NOT EXISTS idx_lv_notif_data ON lv_notificacoes (data_criacao DESC);

ALTER TABLE lv_notificacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo lv_notificacoes" ON lv_notificacoes;
CREATE POLICY "Permitir tudo lv_notificacoes"
  ON lv_notificacoes FOR ALL USING (true) WITH CHECK (true);
