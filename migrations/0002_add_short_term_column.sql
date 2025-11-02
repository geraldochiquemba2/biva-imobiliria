-- Adicionar coluna short_term à tabela properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS short_term BOOLEAN NOT NULL DEFAULT false;

-- Criar índice para melhorar a performance de queries com filtro short_term
CREATE INDEX IF NOT EXISTS properties_short_term_idx ON properties(short_term);

-- Criar índice composto para queries que filtram por short_term e status
CREATE INDEX IF NOT EXISTS properties_short_term_status_idx ON properties(short_term, status);
