-- Schema do Banco de Dados de GESTÃO
-- Usuários, Permissões, Integrações, Logs

-- Tabela de Perfis de Permissão
CREATE TABLE IF NOT EXISTS perfis (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    cor VARCHAR(20) DEFAULT 'blue',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Permissões
CREATE TABLE IF NOT EXISTS permissoes (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(100) NOT NULL UNIQUE, -- ex: 'dashboard_leitura'
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    modulo VARCHAR(50) NOT NULL, -- Dashboard, Banco de Dados, Configurações
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Relacionamento Perfil-Permissão
CREATE TABLE IF NOT EXISTS perfil_permissoes (
    perfil_id INTEGER REFERENCES perfis(id) ON DELETE CASCADE,
    permissao_id INTEGER REFERENCES permissoes(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (perfil_id, permissao_id)
);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    perfil_id INTEGER REFERENCES perfis(id),
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

-- Tabela de Log de Atividades dos Usuários
CREATE TABLE IF NOT EXISTS log_atividades (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL, -- login, logout, criar_usuario, editar_permissao, etc
    modulo VARCHAR(50), -- Usuários, Integrações, Dashboard, etc
    detalhes JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Dados Exemplo (rastreamento)
CREATE TABLE IF NOT EXISTS dados_exemplo (
    id SERIAL PRIMARY KEY,
    tabela VARCHAR(100) NOT NULL, -- nome da tabela onde o dado foi inserido
    registro_id INTEGER NOT NULL, -- ID do registro na tabela original
    banco VARCHAR(50) NOT NULL, -- transacional, analitico, gestao
    descricao TEXT,
    criado_por VARCHAR(100) DEFAULT 'sistema',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_usuario ON refresh_tokens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_integracoes_sistema ON integracoes(sistema);
CREATE INDEX IF NOT EXISTS idx_integracoes_status ON integracoes(status);
CREATE INDEX IF NOT EXISTS idx_logs_integracao ON logs_sincronizacao(integracao_id);
CREATE INDEX IF NOT EXISTS idx_log_atividades_usuario ON log_atividades(usuario_id);
CREATE INDEX IF NOT EXISTS idx_log_atividades_acao ON log_atividades(acao);
CREATE INDEX IF NOT EXISTS idx_dados_exemplo_tabela ON dados_exemplo(tabela, registro_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_perfis_updated_at BEFORE UPDATE ON perfis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integracoes_updated_at BEFORE UPDATE ON integracoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir permissões padrão do sistema
INSERT INTO permissoes (chave, nome, descricao, modulo) VALUES
('dashboard_leitura', 'Dashboard - Leitura', 'Visualizar dashboards e indicadores', 'Dashboard'),
('dashboard_manipular', 'Dashboard - Manipular', 'Editar e personalizar dashboards', 'Dashboard'),
('relatorios', 'Relatórios', 'Acessar e exportar relatórios', 'Dashboard'),
('integracoes', 'Integrações', 'Gerenciar integrações com sistemas externos', 'Banco de Dados'),
('formularios', 'Formulários', 'Acessar e gerenciar formulários', 'Banco de Dados'),
('usuarios', 'Gerenciar Usuários', 'Criar, editar e excluir usuários', 'Configurações'),
('permissoes', 'Gerenciar Permissões', 'Criar e editar perfis de permissão', 'Configurações')
ON CONFLICT (chave) DO NOTHING;

-- Inserir perfis padrão
INSERT INTO perfis (nome, descricao, cor) VALUES
('Administrador', 'Acesso total ao sistema', 'purple'),
('Gerente', 'Acesso a relatórios e configurações básicas', 'blue'),
('Operador', 'Acesso apenas a leitura', 'green')
ON CONFLICT (nome) DO NOTHING;

-- Associar permissões aos perfis
-- Administrador: todas as permissões
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT 
    (SELECT id FROM perfis WHERE nome = 'Administrador'),
    id
FROM permissoes
ON CONFLICT DO NOTHING;

-- Gerente: dashboard, relatórios e integrações
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT 
    (SELECT id FROM perfis WHERE nome = 'Gerente'),
    id
FROM permissoes
WHERE chave IN ('dashboard_leitura', 'dashboard_manipular', 'relatorios', 'integracoes')
ON CONFLICT DO NOTHING;

-- Operador: apenas leitura
INSERT INTO perfil_permissoes (perfil_id, permissao_id)
SELECT 
    (SELECT id FROM perfis WHERE nome = 'Operador'),
    id
FROM permissoes
WHERE chave IN ('dashboard_leitura')
ON CONFLICT DO NOTHING;
