-- DWV Campaign Studio — Schema PostgreSQL (Supabase)
-- Execute no SQL Editor do Supabase

CREATE TABLE executivos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         TEXT NOT NULL,
  cargo        TEXT DEFAULT 'Executivo de Parcerias',
  regiao       TEXT,
  whatsapp     TEXT,
  email        TEXT,
  foto_b64     TEXT,
  ativo        BOOLEAN DEFAULT TRUE,
  criado_em    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campanhas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID REFERENCES auth.users,
  executivo_id    UUID REFERENCES executivos,
  tipo            TEXT,       -- lancamento / case / educativo / evento
  cliente         TEXT,
  empreendimento  TEXT,
  briefing        JSONB,
  copy            JSONB,
  status          TEXT DEFAULT 'rascunho',
  criada_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pecas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id  UUID REFERENCES campanhas ON DELETE CASCADE,
  formato      TEXT,         -- story / post / email
  versao       INTEGER DEFAULT 1,
  html         TEXT,
  arquivo_url  TEXT,
  is_atual     BOOLEAN DEFAULT TRUE,
  criada_em    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mensagens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id  UUID REFERENCES campanhas ON DELETE CASCADE,
  formato      TEXT,         -- story / post / email / geral
  role         TEXT,         -- user / assistant
  conteudo     TEXT,
  criada_em    TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_campanhas_executivo  ON campanhas(executivo_id);
CREATE INDEX idx_pecas_campanha       ON pecas(campanha_id);
CREATE INDEX idx_mensagens_campanha   ON mensagens(campanha_id);

-- RLS (Row Level Security) — habilite depois de configurar auth
-- ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pecas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE executivos ENABLE ROW LEVEL SECURITY;
