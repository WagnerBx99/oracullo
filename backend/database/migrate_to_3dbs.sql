-- Script de Migração: Banco Único → 3 Bancos de Dados
-- Este script migra os dados do banco atual (oracullo) para os 3 novos bancos

-- ============================================
-- PARTE 1: Migrar dados para DB GESTÃO
-- ============================================

-- Conectar no banco oracullo_gestao e copiar dados de gestão

-- Copiar integrações
INSERT INTO oracullo_gestao.integracoes 
SELECT * FROM oracullo.integracoes
ON CONFLICT (id) DO NOTHING;

-- Copiar logs de sincronização
INSERT INTO oracullo_gestao.logs_sincronizacao 
SELECT * FROM oracullo.logs_sincronizacao
ON CONFLICT (id) DO NOTHING;

-- Copiar usuários (se existirem)
INSERT INTO oracullo_gestao.usuarios (id, nome, email, senha_hash, perfil_id, ativo, ultimo_login, created_at, updated_at)
SELECT 
    id, 
    nome, 
    email, 
    senha_hash,
    CASE 
        WHEN role = 'admin' THEN (SELECT id FROM oracullo_gestao.perfis WHERE nome = 'Administrador')
        ELSE (SELECT id FROM oracullo_gestao.perfis WHERE nome = 'Operador')
    END as perfil_id,
    ativo,
    ultimo_login,
    created_at,
    updated_at
FROM oracullo.usuarios
ON CONFLICT (email) DO NOTHING;

-- Copiar refresh tokens (se existirem)
INSERT INTO oracullo_gestao.refresh_tokens 
SELECT * FROM oracullo.refresh_tokens
ON CONFLICT (token) DO NOTHING;

-- ============================================
-- PARTE 2: Migrar dados para DB TRANSACIONAL
-- ============================================

-- Copiar clientes
INSERT INTO oracullo_transacional.clientes 
SELECT * FROM oracullo.clientes
ON CONFLICT (integracao_id, external_id) DO NOTHING;

-- Copiar produtos
INSERT INTO oracullo_transacional.produtos 
SELECT * FROM oracullo.produtos
ON CONFLICT (integracao_id, external_id) DO NOTHING;

-- Copiar pedidos (se existirem)
INSERT INTO oracullo_transacional.pedidos 
SELECT * FROM oracullo.pedidos
ON CONFLICT (integracao_id, external_id) DO NOTHING;

-- ============================================
-- PARTE 3: Processar dados para DB ANALÍTICO
-- ============================================

-- Unificar clientes por CPF/CNPJ
INSERT INTO oracullo_analitico.clientes_unificados (
    cpf_cnpj,
    nome,
    email,
    telefone,
    endereco,
    cidade,
    estado,
    cep,
    total_filiais,
    filiais_ids,
    created_at,
    updated_at
)
SELECT 
    cpf_cnpj,
    MAX(nome) as nome,
    MAX(email) as email,
    MAX(telefone) as telefone,
    MAX(endereco) as endereco,
    MAX(cidade) as cidade,
    MAX(estado) as estado,
    MAX(cep) as cep,
    COUNT(DISTINCT integracao_id) as total_filiais,
    ARRAY_AGG(DISTINCT integracao_id) as filiais_ids,
    MIN(created_at) as created_at,
    MAX(updated_at) as updated_at
FROM oracullo_transacional.clientes
WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != ''
GROUP BY cpf_cnpj
ON CONFLICT (cpf_cnpj) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    telefone = EXCLUDED.telefone,
    total_filiais = EXCLUDED.total_filiais,
    filiais_ids = EXCLUDED.filiais_ids,
    updated_at = CURRENT_TIMESTAMP;

-- Criar relacionamento cliente unificado x cliente transacional
INSERT INTO oracullo_analitico.cliente_unificado_origem (
    cliente_unificado_id,
    cliente_transacional_id,
    integracao_id
)
SELECT 
    cu.id as cliente_unificado_id,
    c.id as cliente_transacional_id,
    c.integracao_id
FROM oracullo_transacional.clientes c
JOIN oracullo_analitico.clientes_unificados cu ON c.cpf_cnpj = cu.cpf_cnpj
WHERE c.cpf_cnpj IS NOT NULL AND c.cpf_cnpj != ''
ON CONFLICT DO NOTHING;

-- Registrar dados atuais como "dados de exemplo"
INSERT INTO oracullo_gestao.dados_exemplo (tabela, registro_id, banco, descricao, criado_por)
SELECT 
    'clientes' as tabela,
    id as registro_id,
    'transacional' as banco,
    'Clientes sincronizados da OMIE - Dados reais de integração' as descricao,
    'migracao_automatica' as criado_por
FROM oracullo_transacional.clientes;

-- ============================================
-- PARTE 4: Verificação
-- ============================================

-- Verificar contagem de registros migrados
SELECT 
    'DB Gestão - Integrações' as tabela,
    COUNT(*) as total
FROM oracullo_gestao.integracoes
UNION ALL
SELECT 
    'DB Gestão - Usuários' as tabela,
    COUNT(*) as total
FROM oracullo_gestao.usuarios
UNION ALL
SELECT 
    'DB Transacional - Clientes' as tabela,
    COUNT(*) as total
FROM oracullo_transacional.clientes
UNION ALL
SELECT 
    'DB Transacional - Produtos' as tabela,
    COUNT(*) as total
FROM oracullo_transacional.produtos
UNION ALL
SELECT 
    'DB Analítico - Clientes Unificados' as tabela,
    COUNT(*) as total
FROM oracullo_analitico.clientes_unificados;
