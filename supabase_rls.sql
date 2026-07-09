-- BIA JOIAS - Politicas RLS (rodar no SQL Editor do Supabase)
-- https://supabase.com/dashboard/project/nzzbzrtmotrjdhczdazf/sql/new

-- Remove politicas existentes antes de recriar
DROP POLICY IF EXISTS "anon_all" ON maletas;
DROP POLICY IF EXISTS "anon_all" ON categorias;
DROP POLICY IF EXISTS "anon_all" ON produtos;
DROP POLICY IF EXISTS "anon_all" ON clientes;
DROP POLICY IF EXISTS "anon_all" ON vendas;
DROP POLICY IF EXISTS "anon_all" ON reservas;
DROP POLICY IF EXISTS "anon_all" ON devolucoes;
DROP POLICY IF EXISTS "anon_all" ON reposicoes;
DROP POLICY IF EXISTS "anon_all" ON movimentacoes;

ALTER TABLE maletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE devolucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON maletas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON categorias FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON produtos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON clientes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vendas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON reservas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON devolucoes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON reposicoes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON movimentacoes FOR ALL TO anon USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
