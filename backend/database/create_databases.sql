-- Script para criar a arquitetura de 3 bancos de dados
-- Executar como superusuário PostgreSQL

-- 1. DB TRANSACIONAL
-- Dados operacionais em tempo real: vendas, pedidos, estoque, movimentações
CREATE DATABASE oracullo_transacional
    WITH 
    OWNER = oracullo_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'pt_BR.UTF-8'
    LC_CTYPE = 'pt_BR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE oracullo_transacional IS 'Banco de dados transacional - Dados operacionais em tempo real';

-- 2. DB ANALÍTICO
-- Dados consolidados para análise: relatórios, dashboards, KPIs, histórico
CREATE DATABASE oracullo_analitico
    WITH 
    OWNER = oracullo_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'pt_BR.UTF-8'
    LC_CTYPE = 'pt_BR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE oracullo_analitico IS 'Banco de dados analítico - Relatórios, dashboards e KPIs consolidados';

-- 3. DB GESTÃO
-- Dados de configuração: usuários, permissões, integrações, logs
CREATE DATABASE oracullo_gestao
    WITH 
    OWNER = oracullo_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'pt_BR.UTF-8'
    LC_CTYPE = 'pt_BR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE oracullo_gestao IS 'Banco de dados de gestão - Usuários, permissões, configurações e integrações';
