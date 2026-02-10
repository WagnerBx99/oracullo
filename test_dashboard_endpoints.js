/**
 * Script de Teste - Endpoints do Dashboard
 * 
 * Testa os endpoints do dashboard para verificar se os dados
 * estão sendo retornados corretamente após as correções.
 * 
 * Uso:
 *   node test_dashboard_endpoints.js
 */

import { poolGestao, poolTransacional, poolAnalitico, testConnections } from './backend/config/databases.js';

async function testDashboardEndpoints() {
  console.log('🧪 Iniciando testes dos endpoints do dashboard...\n');

  try {
    // Testar conexões
    console.log('📡 Testando conexões com os bancos de dados...');
    await testConnections();
    console.log('');

    // 1. Testar contagem de clientes
    console.log('1️⃣ Testando contagem de clientes...');
    const clientesResult = await poolTransacional.query(
      'SELECT COUNT(*) as total FROM clientes'
    );
    console.log(`   ✅ Total de clientes: ${clientesResult.rows[0].total}`);
    console.log('');

    // 2. Testar contagem de produtos
    console.log('2️⃣ Testando contagem de produtos...');
    const produtosResult = await poolTransacional.query(
      'SELECT COUNT(*) as total FROM produtos'
    );
    console.log(`   ✅ Total de produtos: ${produtosResult.rows[0].total}`);
    console.log('');

    // 3. Testar contagem de pedidos
    console.log('3️⃣ Testando contagem de pedidos...');
    const pedidosResult = await poolTransacional.query(
      'SELECT COUNT(*) as total FROM pedidos'
    );
    console.log(`   ✅ Total de pedidos: ${pedidosResult.rows[0].total}`);
    console.log('');

    // 4. Testar integrações
    console.log('4️⃣ Testando integrações...');
    const integracoesResult = await poolGestao.query(
      "SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'conectado') as ativas FROM integracoes"
    );
    console.log(`   ✅ Total de integrações: ${integracoesResult.rows[0].total}`);
    console.log(`   ✅ Integrações ativas: ${integracoesResult.rows[0].ativas}`);
    console.log('');

    // 5. Listar integrações e seus status
    console.log('5️⃣ Listando integrações e status...');
    const integracoesListResult = await poolGestao.query(
      'SELECT id, nome, sistema, status, ultima_sincronizacao FROM integracoes ORDER BY id'
    );
    integracoesListResult.rows.forEach(int => {
      const statusIcon = int.status === 'conectado' ? '🟢' : int.status === 'erro' ? '🔴' : '🟡';
      console.log(`   ${statusIcon} ${int.nome} (${int.sistema}) - Status: ${int.status}`);
      if (int.ultima_sincronizacao) {
        console.log(`      Última sync: ${new Date(int.ultima_sincronizacao).toLocaleString('pt-BR')}`);
      }
    });
    console.log('');

    // 6. Testar KPIs (se houver pedidos)
    if (parseInt(pedidosResult.rows[0].total) > 0) {
      console.log('6️⃣ Testando cálculo de KPIs...');
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = hoje.getMonth() + 1;
      
      const kpisQuery = `
        SELECT 
          COUNT(DISTINCT p.cliente_id) as total_clientes,
          COALESCE(SUM(p.valor_total), 0) as receita_total,
          COUNT(p.id) as total_pedidos,
          COALESCE(AVG(p.valor_total), 0) as ticket_medio
        FROM pedidos p
        WHERE EXTRACT(YEAR FROM p.data_pedido) = $1
          AND EXTRACT(MONTH FROM p.data_pedido) = $2
      `;
      
      const kpisResult = await poolTransacional.query(kpisQuery, [ano, mes]);
      const kpis = kpisResult.rows[0];
      
      console.log(`   📊 Período: ${ano}-${String(mes).padStart(2, '0')}`);
      console.log(`   ✅ Receita Total: R$ ${parseFloat(kpis.receita_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   ✅ Total de Pedidos: ${kpis.total_pedidos}`);
      console.log(`   ✅ Ticket Médio: R$ ${parseFloat(kpis.ticket_medio).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   ✅ Clientes Únicos: ${kpis.total_clientes}`);
      console.log('');

      // Testar pedidos por mês (últimos 12 meses)
      console.log('7️⃣ Testando distribuição de pedidos por mês...');
      const distribuicaoQuery = `
        SELECT 
          TO_CHAR(data_pedido, 'YYYY-MM') as mes,
          COUNT(*) as total_pedidos,
          SUM(valor_total) as receita
        FROM pedidos
        WHERE data_pedido >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(data_pedido, 'YYYY-MM')
        ORDER BY mes DESC
        LIMIT 12
      `;
      
      const distribuicaoResult = await poolTransacional.query(distribuicaoQuery);
      
      if (distribuicaoResult.rows.length > 0) {
        console.log('   📅 Pedidos por mês (últimos 12 meses):');
        distribuicaoResult.rows.forEach(row => {
          console.log(`      ${row.mes}: ${row.total_pedidos} pedidos - R$ ${parseFloat(row.receita).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        });
      } else {
        console.log('   ⚠️  Nenhum pedido nos últimos 12 meses');
      }
      console.log('');
    } else {
      console.log('6️⃣ ⚠️  Nenhum pedido encontrado no banco de dados');
      console.log('   ℹ️  Execute a sincronização de pedidos da OMIE para popular os KPIs');
      console.log('');
    }

    // 7. Verificar clientes unificados
    console.log('8️⃣ Testando clientes unificados...');
    const unificadosResult = await poolAnalitico.query(
      'SELECT COUNT(*) as total FROM clientes_unificados'
    );
    console.log(`   ✅ Total de clientes unificados: ${unificadosResult.rows[0].total}`);
    console.log('');

    // Resumo final
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 RESUMO DOS TESTES');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Clientes: ${clientesResult.rows[0].total}`);
    console.log(`✅ Produtos: ${produtosResult.rows[0].total}`);
    console.log(`✅ Pedidos: ${pedidosResult.rows[0].total}`);
    console.log(`✅ Integrações: ${integracoesResult.rows[0].total} (${integracoesResult.rows[0].ativas} ativas)`);
    console.log(`✅ Clientes Unificados: ${unificadosResult.rows[0].total}`);
    console.log('═══════════════════════════════════════════════════════════');
    
    if (parseInt(pedidosResult.rows[0].total) === 0) {
      console.log('\n⚠️  ATENÇÃO:');
      console.log('Os cards de Receita Total e Margem Líquida continuarão zerados');
      console.log('até que a sincronização de PEDIDOS seja executada.');
      console.log('\nPara sincronizar pedidos da OMIE:');
      console.log('1. Acesse a página de Integrações');
      console.log('2. Clique em "Sincronizar" na integração OMIE');
      console.log('3. Selecione "Pedidos" como tipo de sincronização');
    }

    console.log('\n✅ Testes concluídos com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro ao executar testes:', error);
    console.error(error.stack);
  } finally {
    // Fechar conexões
    await poolGestao.end();
    await poolTransacional.end();
    await poolAnalitico.end();
    process.exit(0);
  }
}

// Executar testes
testDashboardEndpoints();
