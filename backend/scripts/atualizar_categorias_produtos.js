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

async function atualizarCategorias() {
  try {
    console.log('🔄 Iniciando atualização de categorias dos produtos...\n');

    // Buscar produtos com data_json
    const result = await pool.query(`
      SELECT id, nome, data_json
      FROM produtos
      WHERE data_json IS NOT NULL
    `);

    console.log(`📦 Total de produtos com data_json: ${result.rows.length}\n`);

    let atualizados = 0;
    let semCategoria = 0;
    let erros = 0;

    for (const produto of result.rows) {
      try {
        // Extrair descricao_familia do JSON
        const dataJson = typeof produto.data_json === 'string' 
          ? JSON.parse(produto.data_json) 
          : produto.data_json;

        const categoria = dataJson.descricao_familia;

        if (categoria && categoria.trim() !== '') {
          // Atualizar categoria do produto
          await pool.query(
            'UPDATE produtos SET categoria = $1 WHERE id = $2',
            [categoria.trim(), produto.id]
          );
          
          atualizados++;
          
          if (atualizados % 100 === 0) {
            console.log(`✅ ${atualizados} produtos atualizados...`);
          }
        } else {
          semCategoria++;
        }
      } catch (error) {
        erros++;
        console.error(`❌ Erro ao processar produto ${produto.id}:`, error.message);
      }
    }

    console.log('\n📊 Resumo da atualização:');
    console.log(`✅ Produtos atualizados: ${atualizados}`);
    console.log(`⚠️  Produtos sem categoria: ${semCategoria}`);
    console.log(`❌ Erros: ${erros}`);

    // Listar categorias únicas encontradas
    const categorias = await pool.query(`
      SELECT categoria, COUNT(*) as total
      FROM produtos
      WHERE categoria IS NOT NULL
      GROUP BY categoria
      ORDER BY total DESC
    `);

    console.log('\n📋 Categorias encontradas:');
    categorias.rows.forEach(cat => {
      console.log(`   ${cat.categoria}: ${cat.total} produtos`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await pool.end();
  }
}

// Executar
atualizarCategorias();
