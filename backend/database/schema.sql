-- Schema do Banco de Dados Oracullo
-- PostgreSQL 16+

-- Tabela de Usuários (autenticação JWT)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    ativo BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revogado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Integrações
CREATE TABLE IF NOT EXISTS integracoes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('CRM', 'ERP', 'OP')),
    sistema VARCHAR(50) NOT NULL CHECK (sistema IN ('omie', 'wk_radar', 'mercos', 'clic')),
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    company_token TEXT,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'conectado', 'erro')),
    ultima_sincronizacao TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clientes (sincronizados dos sistemas)
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    integracao_id INTEGER REFERENCES integracoes(id) ON DELETE CASCADE,
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
    integracao_id INTEGER REFERENCES integracoes(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL, -- ID no sistema externo
    codigo VARCHAR(100),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2),
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
    integracao_id INTEGER REFERENCES integracoes(id) ON DELETE CASCADE,
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

-- Tabela de Logs de Sincronização
CREATE TABLE IF NOT EXISTS logs_sincronizacao (
    id SERIAL PRIMARY KEY,
    integracao_id INTEGER REFERENCES integracoes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- clientes, produtos, pedidos
    status VARCHAR(50) NOT NULL, -- sucesso, erro
    total_registros INTEGER DEFAULT 0,
    mensagem TEXT,
    erro_detalhes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_integracoes_sistema ON integracoes(sistema);
CREATE INDEX IF NOT EXISTS idx_integracoes_status ON integracoes(status);
CREATE INDEX IF NOT EXISTS idx_clientes_integracao ON clientes(integracao_id);
CREATE INDEX IF NOT EXISTS idx_clientes_external_id ON clientes(external_id);
CREATE INDEX IF NOT EXISTS idx_produtos_integracao ON produtos(integracao_id);
CREATE INDEX IF NOT EXISTS idx_produtos_external_id ON produtos(external_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_integracao ON pedidos(integracao_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_external_id ON pedidos(external_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_logs_integracao ON logs_sincronizacao(integracao_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_integracoes_updated_at BEFORE UPDATE ON integracoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
