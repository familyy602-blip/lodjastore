-- ============================================================
-- LOJA VIRTUAL LODJA — Schema Supabase
-- Execute no SQL Editor do MESMO projecto do LODJA v1
-- Depois disto, pedidos/produtos passam a gravar na cloud
-- (deixam de depender do localStorage do browser)
-- ============================================================

CREATE TABLE IF NOT EXISTS lv_categorias (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  imagem TEXT,
  estado TEXT DEFAULT 'activo',
  ordem INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lv_subcategorias (
  id TEXT PRIMARY KEY,
  categoria_id TEXT REFERENCES lv_categorias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  estado TEXT DEFAULT 'activo'
);

CREATE TABLE IF NOT EXISTS lv_produtos (
  id TEXT PRIMARY KEY,
  codigo TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria_id TEXT,
  subcategoria_id TEXT,
  preco NUMERIC DEFAULT 0,
  preco_promocional NUMERIC,
  estado TEXT DEFAULT 'activo',
  destaque BOOLEAN DEFAULT false,
  tendencia BOOLEAN DEFAULT false,
  data_criacao TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lv_variacoes (
  id TEXT PRIMARY KEY,
  produto_id TEXT REFERENCES lv_produtos(id) ON DELETE CASCADE,
  tamanho TEXT,
  cor TEXT,
  codigo TEXT,
  stock INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lv_produto_imagens (
  id TEXT PRIMARY KEY,
  produto_id TEXT REFERENCES lv_produtos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  ordem INT DEFAULT 0,
  tipo TEXT DEFAULT 'secundaria',
  data_upload TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lv_clientes (
  id TEXT PRIMARY KEY,
  nome TEXT,
  telefone TEXT,
  email TEXT,
  morada TEXT,
  estado TEXT DEFAULT 'activo',
  lodja_cliente_id TEXT,
  data_criacao TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lv_pedidos (
  id TEXT PRIMARY KEY,
  numero_pedido TEXT UNIQUE NOT NULL,
  cliente_id TEXT,
  cliente_nome TEXT,
  cliente_telefone TEXT,
  cliente_email TEXT,
  subtotal NUMERIC DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  taxa_entrega NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  estado TEXT DEFAULT 'pendente',
  metodo_pagamento TEXT,
  metodo_entrega TEXT,
  morada_entrega TEXT,
  observacoes TEXT,
  lodja_cliente BOOLEAN DEFAULT false,
  lodja_sync BOOLEAN DEFAULT false,
  data_criacao TIMESTAMPTZ DEFAULT NOW(),
  data_confirmacao TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ
);

-- Colunas extra se a tabela já existia sem elas
ALTER TABLE lv_pedidos ADD COLUMN IF NOT EXISTS lodja_cliente BOOLEAN DEFAULT false;
ALTER TABLE lv_pedidos ADD COLUMN IF NOT EXISTS lodja_sync BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS lv_pedido_itens (
  id TEXT PRIMARY KEY,
  pedido_id TEXT REFERENCES lv_pedidos(id) ON DELETE CASCADE,
  produto_id TEXT,
  variacao_id TEXT,
  nome_produto TEXT,
  nome TEXT,
  tamanho TEXT,
  cor TEXT,
  quantidade INT DEFAULT 1,
  preco_unitario NUMERIC DEFAULT 0,
  preco NUMERIC DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lv_promocoes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'percentagem',
  valor NUMERIC DEFAULT 0,
  quantidade_minima INT DEFAULT 1,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  estado TEXT DEFAULT 'activo'
);

CREATE TABLE IF NOT EXISTS lv_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS lv_sincronizacoes_lodja (
  id TEXT PRIMARY KEY,
  pedido_id TEXT,
  referencia TEXT UNIQUE,
  quantidade_pecas INT DEFAULT 0,
  valor_total NUMERIC DEFAULT 0,
  estado TEXT DEFAULT 'pendente',
  data_envio TIMESTAMPTZ,
  data_processamento TIMESTAMPTZ,
  mensagem_erro TEXT,
  tentativas INT DEFAULT 0
);

ALTER TABLE lv_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE lv_subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE lv_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lv_variacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lv_produto_imagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE lv_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lv_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lv_pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE lv_promocoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lv_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE lv_sincronizacoes_lodja ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'lv_categorias','lv_subcategorias','lv_produtos','lv_variacoes',
    'lv_produto_imagens','lv_clientes','lv_pedidos','lv_pedido_itens',
    'lv_promocoes','lv_config','lv_sincronizacoes_lodja'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "lv_all_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "lv_all_%s" ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- Ícone/avatar de categoria
ALTER TABLE lv_categorias ADD COLUMN IF NOT EXISTS icone TEXT;

-- Notificações do painel admin
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
