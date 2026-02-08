-- Schema do Banco de Dados TRANSACIONAL
-- Dados operacionais em tempo real: clientes, produtos, pedidos, estoque

-- Tabela de Clientes (sincronizados dos sistemas)
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    integracao_id INTEGER NOT NULL, -- Referência para integracoes no DB Gestão
    external_id VARCHAR(255) NOT NULL, -- ID no sistema externo
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(50),
    cpf_cnpj VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    data_json JSONB, -- Dados completos do sistema externo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(integracao_id, external_id)
);

-- Tabela de Produtos (sincronizados dos sistemas)
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    integracao_id INTEGER NOT NULL, -- Referência para integracoes no DB Gestão
    external_id VARCHAR(255) NOT NULL, -- ID no sistema externo
    codigo VARCHAR(100),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2),
    custo DECIMAL(10, 2),
    margem DECIMAL(5, 2),
    estoque INTEGER,
    unidade VARCHAR(20),
    categoria VARCHAR(100),
    ativo BOOLEAN DEFAULT true,
    data_json JSONB, -- Dados completos do sistema externo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(integracao_id, external_id)
);

-- Tabela de Pedidos (sincronizados dos sistemas)
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    integracao_id INTEGER NOT NULL, -- Referência para integracoes no DB Gestão
    external_id VARCHAR(255) NOT NULL, -- ID no sistema externo
    cliente_id INTEGER REFERENCES clientes(id),
    numero_pedido VARCHAR(100),
    data_pedido TIMESTAMP,
    valor_total DECIMAL(10, 2),
    status VARCHAR(50),
    observacoes TEXT,
    data_json JSONB, -- Dados completos do sistema externo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(integracao_id, external_id)
);

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id),
    quantidade DECIMAL(10, 2) NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    desconto DECIMAL(10, 2) DEFAULT 0,
    valor_total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Movimentações de Estoque
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES produtos(id),
    tipo VARCHAR(50) NOT NULL, -- entrada, saida, ajuste
    quantidade INTEGER NOT NULL,
    estoque_anterior INTEGER,
    estoque_atual INTEGER,
    motivo TEXT,
    usuario_id INTEGER, -- Referência para usuarios no DB Gestão
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_integracao ON clientes(integracao_id);
CREATE INDEX IF NOT EXISTS idx_clientes_external_id ON clientes(external_id);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_produtos_integracao ON produtos(integracao_id);
CREATE INDEX IF NOT EXISTS idx_produtos_external_id ON produtos(external_id);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_pedidos_integracao ON pedidos(integracao_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_external_id ON pedidos(external_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(data_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON pedido_itens(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_produto ON pedido_itens(produto_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_produto ON estoque_movimentacoes(produto_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
