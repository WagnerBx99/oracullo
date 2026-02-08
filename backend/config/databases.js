import pkg from 'pg';
const { Pool } = pkg;

// Configuração do DB Gestão (usuários, perfis, permissões, integrações)
const poolGestao = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'oracullo_gestao',
  user: process.env.DB_USER || 'oracullo_user',
  password: process.env.DB_PASSWORD || 'oracullo123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Configuração do DB Transacional (clientes, produtos, pedidos, estoque)
const poolTransacional = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'oracullo_transacional',
  user: process.env.DB_USER || 'oracullo_user',
  password: process.env.DB_PASSWORD || 'oracullo123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Configuração do DB Analítico (clientes unificados, KPIs, dashboards)
const poolAnalitico = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'oracullo_analitico',
  user: process.env.DB_USER || 'oracullo_user',
  password: process.env.DB_PASSWORD || 'oracullo123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Testar conexões
poolGestao.on('error', (err) => {
  console.error('[DB Gestão] Erro inesperado:', err);
});

poolTransacional.on('error', (err) => {
  console.error('[DB Transacional] Erro inesperado:', err);
});

poolAnalitico.on('error', (err) => {
  console.error('[DB Analítico] Erro inesperado:', err);
});

// Função para verificar conexões
async function testConnections() {
  try {
    await poolGestao.query('SELECT NOW()');
    console.log('✅ Conectado ao DB Gestão');
  } catch (err) {
    console.error('❌ Erro ao conectar no DB Gestão:', err.message);
  }

  try {
    await poolTransacional.query('SELECT NOW()');
    console.log('✅ Conectado ao DB Transacional');
  } catch (err) {
    console.error('❌ Erro ao conectar no DB Transacional:', err.message);
  }

  try {
    await poolAnalitico.query('SELECT NOW()');
    console.log('✅ Conectado ao DB Analítico');
  } catch (err) {
    console.error('❌ Erro ao conectar no DB Analítico:', err.message);
  }
}

export {
  poolGestao,
  poolTransacional,
  poolAnalitico,
  testConnections,
};

// Manter pool padrão para compatibilidade com código antigo
export default poolGestao;
