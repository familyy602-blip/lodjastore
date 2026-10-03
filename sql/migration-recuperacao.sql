CREATE TABLE IF NOT EXISTS lv_recuperacao (
  id TEXT PRIMARY KEY,
  conta_id TEXT,
  email TEXT,
  telefone TEXT,
  codigo TEXT NOT NULL,
  usado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
ALTER TABLE lv_recuperacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo recuperacao" ON lv_recuperacao;
CREATE POLICY "Permitir tudo recuperacao" ON lv_recuperacao FOR ALL USING (true) WITH CHECK (true);
