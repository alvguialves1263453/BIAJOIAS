-- ============================================
-- BIA JOIAS - DROP + RECRIA TUDO (um script só)
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================

-- Remove políticas
DROP POLICY IF EXISTS "anon_all" ON movimentacoes;
DROP POLICY IF EXISTS "anon_all" ON reposicoes;
DROP POLICY IF EXISTS "anon_all" ON devolucoes;
DROP POLICY IF EXISTS "anon_all" ON reservas;
DROP POLICY IF EXISTS "anon_all" ON vendas;
DROP POLICY IF EXISTS "anon_all" ON produtos;
DROP POLICY IF EXISTS "anon_all" ON clientes;
DROP POLICY IF EXISTS "anon_all" ON categorias;
DROP POLICY IF EXISTS "anon_all" ON maletas;

-- Drop todas as tabelas
DROP TABLE IF EXISTS movimentacoes CASCADE;
DROP TABLE IF EXISTS reposicoes CASCADE;
DROP TABLE IF EXISTS devolucoes CASCADE;
DROP TABLE IF EXISTS reservas CASCADE;
DROP TABLE IF EXISTS vendas CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS maletas CASCADE;

-- ============================================
-- 1. MALETAS
-- ============================================
CREATE TABLE maletas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome TEXT NOT NULL DEFAULT '',
  origem TEXT DEFAULT '',
  "dataRecebimento" TEXT DEFAULT '',
  "dataLimite" TEXT DEFAULT '',
  status TEXT DEFAULT 'Ativa',
  observacoes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CATEGORIAS
-- ============================================
CREATE TABLE categorias (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. PRODUTOS
-- ============================================
CREATE TABLE produtos (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  codigo TEXT DEFAULT '',
  nome TEXT DEFAULT '',
  "maletaId" TEXT DEFAULT NULL,
  "categoria" TEXT DEFAULT NULL,
  tamanho TEXT DEFAULT '',
  "precoVenda" NUMERIC DEFAULT 0,
  "precoCusto" NUMERIC DEFAULT 0,
  fotos JSONB DEFAULT '[]',
  "fotoUrl" TEXT DEFAULT '',
  status TEXT DEFAULT 'Disponível',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. CLIENTES
-- ============================================
CREATE TABLE clientes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  nome TEXT NOT NULL DEFAULT '',
  telefone TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  observacoes TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. VENDAS
-- ============================================
CREATE TABLE vendas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "produtoId" TEXT DEFAULT NULL,
  "clienteId" TEXT DEFAULT NULL,
  telefone TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  valor NUMERIC DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  "formaPagamento" TEXT DEFAULT '',
  parcelas INT DEFAULT 1,
  entrada NUMERIC DEFAULT 0,
  data TEXT DEFAULT '',
  observacao TEXT DEFAULT '',
  recebido BOOLEAN DEFAULT true,
  "carneParcelas" TEXT DEFAULT '',
  "carneVencimento" TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. RESERVAS
-- ============================================
CREATE TABLE reservas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "produtoId" TEXT DEFAULT NULL,
  "clienteId" TEXT DEFAULT NULL,
  "dataReserva" TEXT DEFAULT '',
  "dataExpiracao" TEXT DEFAULT '',
  status TEXT DEFAULT 'Ativa',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. DEVOLUCOES
-- ============================================
CREATE TABLE devolucoes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "maletaId" TEXT DEFAULT NULL,
  produtos JSONB DEFAULT '[]',
  data TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. REPOSICOES
-- ============================================
CREATE TABLE reposicoes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "fotoUrl" TEXT DEFAULT '',
  "maletaId" TEXT DEFAULT NULL,
  "categoriaId" TEXT DEFAULT NULL,
  tamanho TEXT DEFAULT '',
  "dataRecebimento" TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. MOVIMENTACOES (histórico)
-- ============================================
CREATE TABLE movimentacoes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tipo TEXT NOT NULL DEFAULT '',
  descricao TEXT NOT NULL DEFAULT '',
  dados JSONB DEFAULT '{}',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security)
-- ============================================
ALTER TABLE maletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE devolucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;

-- Políticas: permitir tudo para o anon key
CREATE POLICY "anon_all" ON maletas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON categorias FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON produtos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON clientes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vendas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON reservas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON devolucoes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON reposicoes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON movimentacoes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Força refresh completo do schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(0.5);
NOTIFY pgrst, 'reload schema';
