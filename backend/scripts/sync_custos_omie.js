import pkg from 'pg';
import axios from 'axios';
const { Pool } = pkg;

// Configuração do banco de dados
const poolTransacional = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'oracullo_transacional',
  user: process.env.DB_USER || 'oracullo_user',
  password: process.env.DB_PASSWORD || 'oracullo123'
});

const poolGestao = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'oracullo_gestao',
  user: process.env.DB_USER || 'oracullo_user',
  password: process.env.DB_PASSWORD || 'oracullo123'
});

// Credenciais OMIE Curitiba (filial de referência para custos)
const OMIE_CURITIBA = {
  id: 30,
  nome: 'OMIE - Curitiba',
  app_key: '3396322270341',
  app_secret: '66d992e0e9ded7c9d585c71f08643d1f'
};

/**
 * Busca posição de estoque da OMIE (contém nCMC - Custo Médio Contábil)
 */
async function buscarPosicaoEstoque(appKey, appSecret, pagina = 1) {
  try {
    const response = await axios.post('https://app.omie.com.br/api/v1/estoque/consulta/', {
      call: 'ListarPosEstoque',
      app_key: appKey,
      app_secret: appSecret,
      param: [{
        nPagina: pagina,
        nRegPorPagina: 100
      }]
    });

    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar posição de estoque (página ${pagina}):`, error.message);
    throw error;
  }
}

/**
 * Atualiza custo do produto na tabela produtos
 */
async function atualizarCustoProduto(codigo, custo) {
  try {
    const query = `
      UPDATE produtos 
      SET 
        custo = $1,
        margem = CASE 
          WHEN preco > 0 THEN ((preco - $1) / preco * 100)
          ELSE 0
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE codigo = $2 AND ativo = true
    `;
    
    const result = await poolTransacional.query(query, [custo, codigo]);
    return result.rowCount;
  } catch (error) {
    console.error(`Erro ao atualizar custo do produto ${codigo}:`, error.message);
    return 0;
  }
}

/**
 * Sincroniza custos de todos os produtos da OMIE Curitiba
 */
async function sincronizarCustos() {
  console.log('🚀 Iniciando sincronização de custos...');
  console.log(`📍 Filial de referência: ${OMIE_CURITIBA.nome}`);
  console.log('');

  let totalProdutos = 0;
  let produtosAtualizados = 0;
  let produtosComCusto = 0;
  let produtosSemCusto = 0;
  let pagina = 1;
  let totalPaginas = 1;

  try {
    // Buscar todas as páginas
    while (pagina <= totalPaginas) {
      console.log(`📄 Processando página ${pagina}/${totalPaginas}...`);
      
      const dados = await buscarPosicaoEstoque(
        OMIE_CURITIBA.app_key,
        OMIE_CURITIBA.app_secret,
        pagina
      );

      totalPaginas = dados.nTotPaginas;
      totalProdutos += dados.nRegistros;

      // Processar cada produto
      for (const produto of dados.produtos) {
        const codigo = produto.cCodigo;
        const custo = produto.nCMC; // Custo Médio Contábil

        if (custo && custo > 0) {
          const rowsUpdated = await atualizarCustoProduto(codigo, custo);
          if (rowsUpdated > 0) {
            produtosAtualizados++;
            produtosComCusto++;
            console.log(`  ✅ ${codigo} - ${produto.cDescricao.substring(0, 40)}... | Custo: R$ ${custo.toFixed(2)}`);
          }
        } else {
          produtosSemCusto++;
          console.log(`  ⚠️  ${codigo} - Sem custo (nCMC = ${custo})`);
        }
      }

      pagina++;
      
      // Aguardar 500ms entre requisições para não sobrecarregar a API
      if (pagina <= totalPaginas) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Registrar log de sincronização
    await poolGestao.query(`
      INSERT INTO logs_sincronizacao (integracao_id, tipo, status, mensagem)
      VALUES ($1, $2, $3, $4)
    `, [
      OMIE_CURITIBA.id,
      'custos',
      'sucesso',
      `Sincronização de custos concluída: ${produtosAtualizados} produtos atualizados`
    ]);

    console.log('');
    console.log('✅ Sincronização concluída!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Resumo:`);
    console.log(`   Total de produtos processados: ${totalProdutos}`);
    console.log(`   Produtos atualizados: ${produtosAtualizados}`);
    console.log(`   Produtos com custo: ${produtosComCusto}`);
    console.log(`   Produtos sem custo: ${produtosSemCusto}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    
    // Registrar erro no log
    await poolGestao.query(`
      INSERT INTO logs_sincronizacao (integracao_id, tipo, status, mensagem)
      VALUES ($1, $2, $3, $4)
    `, [
      OMIE_CURITIBA.id,
      'custos',
      'erro',
      `Erro na sincronização de custos: ${error.message}`
    ]);
    
    throw error;
  } finally {
    await poolTransacional.end();
    await poolGestao.end();
  }
}

// Executar sincronização
sincronizarCustos()
  .then(() => {
    console.log('🎉 Processo finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Processo finalizado com erro:', error);
    process.exit(1);
  });
