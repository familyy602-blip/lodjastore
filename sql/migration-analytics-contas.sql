-- Visitas (analytics)
CREATE TABLE IF NOT EXISTS lv_visitas (
  id TEXT PRIMARY KEY,
  device_id TEXT,
  pagina TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lv_visitas_created ON lv_visitas (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lv_visitas_device ON lv_visitas (device_id);

-- Contas de clientes (registo por email)
CREATE TABLE IF NOT EXISTS lv_contas_clientes (
  id TEXT PRIMARY KEY,
  nome TEXT,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  pass_hash TEXT NOT NULL,
  estado TEXT DEFAULT 'activo',
  data_criacao TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lv_visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lv_contas_clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo visitas" ON lv_visitas;
CREATE POLICY "Permitir tudo visitas" ON lv_visitas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo contas" ON lv_contas_clientes;
CREATE POLICY "Permitir tudo contas" ON lv_contas_clientes FOR ALL USING (true) WITH CHECK (true);
