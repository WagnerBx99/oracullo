import pkg from 'pg';
const { Pool } = pkg;

// Configuração do banco de dados
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'oracullo_transacional',
  user: 'oracullo_user',
  password: 'oracullo123',
});

// Credenciais OMIE
const OMIE_APP_KEY = '3396306937023';
const OMIE_APP_SECRET = 'ce9d1a20eec3b7127ffa01baf61d569a';
const OMIE_API_URL = 'https://app.omie.com.br/api/v1/estoque/consulta/';

async function listarPosEstoque(pagina = 1, regPorPagina = 100) {
  try {
    const response = await fetch(OMIE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        call: 'ListarPosEstoque',
        app_key: OMIE_APP_KEY,
        app_secret: OMIE_APP_SECRET,
        param: [{
          nPagina: pagina,
          nRegPorPagina: regPorPagina
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Erro ao buscar página ${pagina}:`, error.message);
    throw error;
  }
}

async function sincronizarEstoque() {
  try {
    console.log('🔄 Iniciando sincronização de estoque da OMIE...\n');

    let pagina = 1;
    let totalPaginas = 1;
    let produtosAtualizados = 0;
    let produtosNaoEncontrados = 0;

    do {
      console.log(`📄 Processando página ${pagina}/${totalPaginas}...`);

      const resultado = await listarPosEstoque(pagina, 100);
      totalPaginas = resultado.nTotPaginas;

      console.log(`   ${resultado.produtos.length} produtos nesta página`);

      for (const produto of resultado.produtos) {
        try {
          // Buscar produto pelo código
          const produtoDb = await pool.query(
            'SELECT id FROM produtos WHERE codigo = $1',
            [produto.cCodigo]
          );

          if (produtoDb.rows.length > 0) {
            // Atualizar estoque (usar nSaldo que é o saldo disponível)
            await pool.query(
              'UPDATE produtos SET estoque = $1 WHERE id = $2',
              [produto.nSaldo || 0, produtoDb.rows[0].id]
            );
            produtosAtualizados++;
          } else {
            produtosNaoEncontrados++;
          }
        } catch (error) {
          console.error(`   ❌ Erro ao processar produto ${produto.cCodigo}:`, error.message);
        }
      }

      console.log(`   ✅ ${produtosAtualizados} produtos atualizados até agora\n`);

      pagina++;

      // Delay entre requisições para não sobrecarregar a API
      if (pagina <= totalPaginas) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } while (pagina <= totalPaginas);

    console.log('\n📊 Resumo da sincronização:');
    console.log(`✅ Produtos atualizados: ${produtosAtualizados}`);
    console.log(`⚠️  Produtos não encontrados no banco: ${produtosNaoEncontrados}`);

    // Estatísticas de estoque
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_produtos,
        COUNT(*) FILTER (WHERE estoque > 0) as com_estoque,
        SUM(estoque) as estoque_total,
        AVG(estoque) as estoque_medio
      FROM produtos
      WHERE categoria IS NOT NULL
    `);

    console.log('\n📦 Estatísticas de estoque:');
    console.log(`   Total de produtos: ${stats.rows[0].total_produtos}`);
    console.log(`   Produtos com estoque: ${stats.rows[0].com_estoque}`);
    console.log(`   Estoque total: ${Math.round(stats.rows[0].estoque_total || 0)} unidades`);
    console.log(`   Estoque médio: ${parseFloat(stats.rows[0].estoque_medio || 0).toFixed(2)} unidades/produto`);

    // Top 10 categorias por estoque
    const topCategorias = await pool.query(`
      SELECT 
        categoria,
        SUM(estoque) as estoque_total,
        COUNT(*) as total_produtos
      FROM produtos
      WHERE categoria IS NOT NULL AND estoque > 0
      GROUP BY categoria
      ORDER BY estoque_total DESC
      LIMIT 10
    `);

    console.log('\n📋 Top 10 categorias por estoque:');
    topCategorias.rows.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.categoria}: ${cat.estoque_total} unidades (${cat.total_produtos} produtos)`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await pool.end();
  }
}

// Executar
sincronizarEstoque();
