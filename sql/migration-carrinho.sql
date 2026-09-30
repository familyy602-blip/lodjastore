-- Carrinho na cloud (execute no SQL Editor do Supabase)
CREATE TABLE IF NOT EXISTS lv_carrinho (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  nome TEXT,
  imagem TEXT,
  tamanho TEXT,
  cor TEXT,
  preco NUMERIC DEFAULT 0,
  quantidade INT DEFAULT 1,
  variacao_id TEXT,
  data_atualizacao TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lv_carrinho_device ON lv_carrinho (device_id);
CREATE INDEX IF NOT EXISTS idx_lv_carrinho_produto ON lv_carrinho (produto_id);

ALTER TABLE lv_carrinho ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo carrinho" ON lv_carrinho;
CREATE POLICY "Permitir tudo carrinho"
  ON lv_carrinho
  FOR ALL
  USING (true)
  WITH CHECK (true);
