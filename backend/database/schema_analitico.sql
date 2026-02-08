-- Schema do Banco de Dados ANALÍTICO
-- Dados consolidados para análise: clientes unificados, KPIs, relatórios, dashboards

-- Tabela de Clientes Unificados (consolidação por CPF/CNPJ)
CREATE TABLE IF NOT EXISTS clientes_unificados (
    id SERIAL PRIMARY KEY,
    cpf_cnpj VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(50),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    total_filiais INTEGER DEFAULT 0, -- Em quantas filiais o cliente aparece
    filiais_ids INTEGER[], -- Array com IDs das integrações onde o cliente aparece
    primeira_compra TIMESTAMP,
    ultima_compra TIMESTAMP,
    total_pedidos INTEGER DEFAULT 0,
    valor_total_compras DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Relacionamento Cliente Unificado x Cliente Transacional
CREATE TABLE IF NOT EXISTS cliente_unificado_origem (
    cliente_unificado_id INTEGER REFERENCES clientes_unificados(id) ON DELETE CASCADE,
    cliente_transacional_id INTEGER NOT NULL, -- ID do cliente no DB Transacional
    integracao_id INTEGER NOT NULL, -- ID da integração (filial)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (cliente_unificado_id, cliente_transacional_id, integracao_id)
);

-- Tabela de KPIs Consolidados (snapshot diário)
CREATE TABLE IF NOT EXISTS kpis_consolidados (
    id SERIAL PRIMARY KEY,
    data_referencia DATE NOT NULL,
    integracao_id INTEGER, -- NULL = todas as filiais
    
    -- KPIs Financeiros
    faturamento_total DECIMAL(12, 2) DEFAULT 0,
    faturamento_meta DECIMAL(12, 2) DEFAULT 0,
    margem_operacional DECIMAL(5, 2) DEFAULT 0,
    roi_geral DECIMAL(5, 2) DEFAULT 0,
    lucro_liquido DECIMAL(12, 2) DEFAULT 0,
    
    -- KPIs Comerciais
    total_vendas INTEGER DEFAULT 0,
    ticket_medio DECIMAL(10, 2) DEFAULT 0,
    taxa_conversao DECIMAL(5, 2) DEFAULT 0,
    nps INTEGER DEFAULT 0,
    
    -- KPIs Operacionais
    eficiencia_geral DECIMAL(5, 2) DEFAULT 0,
    prazo_medio_entrega DECIMAL(5, 2) DEFAULT 0,
    taxa_entrega DECIMAL(5, 2) DEFAULT 0,
    nao_conformidades DECIMAL(5, 2) DEFAULT 0,
    
    -- KPIs de Produtos
    total_produtos INTEGER DEFAULT 0,
    produtos_ativos INTEGER DEFAULT 0,
    custo_medio DECIMAL(10, 2) DEFAULT 0,
    novos_precos INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(data_referencia, integracao_id)
);

-- Tabela de Vendas Consolidadas por Filial/Vendedor
CREATE TABLE IF NOT EXISTS vendas_consolidadas (
    id SERIAL PRIMARY KEY,
    data_referencia DATE NOT NULL,
    integracao_id INTEGER NOT NULL, -- ID da integração (filial)
    vendedor_nome VARCHAR(255),
    vendedor_id VARCHAR(100), -- ID do vendedor no sistema externo
    
    -- Métricas
    quantidade_vendas INTEGER DEFAULT 0,
    valor_total DECIMAL(12, 2) DEFAULT 0,
    valor_dia DECIMAL(12, 2) DEFAULT 0,
    valor_mes DECIMAL(12, 2) DEFAULT 0,
    ticket_medio DECIMAL(10, 2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(data_referencia, integracao_id, vendedor_id)
);

-- Tabela de Performance por Produto
CREATE TABLE IF NOT EXISTS produtos_performance (
    id SERIAL PRIMARY KEY,
    data_referencia DATE NOT NULL,
    produto_id INTEGER NOT NULL, -- ID do produto no DB Transacional
    integracao_id INTEGER NOT NULL,
    
    -- Métricas
    quantidade_vendida INTEGER DEFAULT 0,
    receita DECIMAL(12, 2) DEFAULT 0,
    custo_total DECIMAL(12, 2) DEFAULT 0,
    margem DECIMAL(5, 2) DEFAULT 0,
    estoque_medio INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(data_referencia, produto_id, integracao_id)
);

-- Tabela de Distribuição de Receita (para gráficos de pizza)
CREATE TABLE IF NOT EXISTS receita_distribuicao (
    id SERIAL PRIMARY KEY,
    data_referencia DATE NOT NULL,
    integracao_id INTEGER, -- NULL = todas as filiais
    categoria VARCHAR(100) NOT NULL, -- Produtos, Serviços, Consultoria, Outros
    valor DECIMAL(12, 2) DEFAULT 0,
    percentual DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(data_referencia, integracao_id, categoria)
);

-- Tabela de Comparativo Ano a Ano
CREATE TABLE IF NOT EXISTS comparativo_anual (
    id SERIAL PRIMARY KEY,
    ano INTEGER NOT NULL,
    trimestre INTEGER NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
    integracao_id INTEGER, -- NULL = todas as filiais
    faturamento DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ano, trimestre, integracao_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_unif_cpf_cnpj ON clientes_unificados(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_cliente_unif_origem_unif ON cliente_unificado_origem(cliente_unificado_id);
CREATE INDEX IF NOT EXISTS idx_cliente_unif_origem_trans ON cliente_unificado_origem(cliente_transacional_id);
CREATE INDEX IF NOT EXISTS idx_kpis_data ON kpis_consolidados(data_referencia);
CREATE INDEX IF NOT EXISTS idx_kpis_integracao ON kpis_consolidados(integracao_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cons_data ON vendas_consolidadas(data_referencia);
CREATE INDEX IF NOT EXISTS idx_vendas_cons_integracao ON vendas_consolidadas(integracao_id);
CREATE INDEX IF NOT EXISTS idx_produtos_perf_data ON produtos_performance(data_referencia);
CREATE INDEX IF NOT EXISTS idx_produtos_perf_produto ON produtos_performance(produto_id);
CREATE INDEX IF NOT EXISTS idx_receita_dist_data ON receita_distribuicao(data_referencia);
CREATE INDEX IF NOT EXISTS idx_comp_anual_ano ON comparativo_anual(ano, trimestre);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clientes_unif_updated_at BEFORE UPDATE ON clientes_unificados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
