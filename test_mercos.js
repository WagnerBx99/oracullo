/**
 * Script de teste para integração com MERCOS
 * Execute com: node test_mercos.js
 */

import MercosService from './src/api/mercosService.js';

// Credenciais do sandbox
const APPLICATION_TOKEN = 'd39001ac-0b14-11f0-8ed7-6e1485be00f2';
const COMPANY_TOKEN = '2a2ff3ec-c3ab-11f0-b7b0-5605c2a06131';

async function testMercosIntegration() {
  console.log('=== Teste de Integração MERCOS ===\n');

  // Inicializa o serviço
  const mercos = new MercosService(APPLICATION_TOKEN, COMPANY_TOKEN, false);

  try {
    // 1. Testa conexão
    console.log('1. Testando conexão...');
    const isConnected = await mercos.testConnection();
    if (!isConnected) {
      console.error('❌ Falha na conexão. Abortando testes.');
      return;
    }
    console.log('✅ Conexão OK\n');

    // 2. Busca clientes
    console.log('2. Buscando clientes...');
    const clientes = await mercos.getClientes();
    console.log(`✅ ${clientes.length} clientes encontrados`);
    if (clientes.length > 0) {
      console.log('Exemplo de cliente:', JSON.stringify(clientes[0], null, 2));
    }
    console.log('');

    // 3. Busca produtos
    console.log('3. Buscando produtos...');
    const produtos = await mercos.getProdutos();
    console.log(`✅ ${produtos.length} produtos encontrados`);
    if (produtos.length > 0) {
      console.log('Exemplo de produto:', JSON.stringify(produtos[0], null, 2));
    }
    console.log('');

    // 4. Busca pedidos
    console.log('4. Buscando pedidos...');
    const pedidos = await mercos.getPedidos();
    console.log(`✅ ${pedidos.length} pedidos encontrados`);
    if (pedidos.length > 0) {
      console.log('Exemplo de pedido:', JSON.stringify(pedidos[0], null, 2));
    }
    console.log('');

    console.log('=== Teste concluído com sucesso! ===');
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.error(error);
  }
}

// Executa os testes
testMercosIntegration();
