-- Fornecedores + ligação aos produtos
CREATE TABLE IF NOT EXISTS lv_fornecedores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT,
  contacto TEXT,
  telefone TEXT,
  email TEXT,
  morada TEXT,
  notas TEXT,
  estado TEXT DEFAULT 'activo',
  data_criacao TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lv_forn_codigo
  ON lv_fornecedores (codigo) WHERE codigo IS NOT NULL;

ALTER TABLE lv_produtos ADD COLUMN IF NOT EXISTS fornecedor_id TEXT;

CREATE INDEX IF NOT EXISTS idx_lv_prod_fornecedor ON lv_produtos (fornecedor_id);

ALTER TABLE lv_fornecedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo fornecedores" ON lv_fornecedores;
CREATE POLICY "Permitir tudo fornecedores"
  ON lv_fornecedores FOR ALL USING (true) WITH CHECK (true);
