-- Adicionar coluna price_per_hour à tabela properties para suportar Coworking
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_hour NUMERIC(15,2);

-- Comentário para documentar o uso da coluna
COMMENT ON COLUMN properties.price_per_hour IS 'Preço por hora para espaços de Coworking. NULL para outras categorias.';
