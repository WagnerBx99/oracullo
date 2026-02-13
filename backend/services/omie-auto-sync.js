/**
 * Serviço de Sincronização Automática OMIE
 * 
 * Executa sincronização a cada 10 minutos de forma sequencial:
 * 1. Clientes
 * 2. Produtos
 * 3. Pedidos
 * 4. Estoque
 * 
 * Arquivo: /var/www/oracullo_LuizGouveia/backend/services/omie-auto-sync.js
 */

import axios from 'axios';

const BACKEND_URL = 'http://localhost:3201';
const SYNC_INTERVAL = 10 * 60 * 1000; // 10 minutos em milissegundos

class OmieAutoSyncService {
  constructor() {
    this.isRunning = false;
    this.lastSync = null;
    this.syncHistory = [];
    this.intervalId = null;
  }

  /**
   * Inicia o serviço de sincronização automática
   */
  start() {
    console.log('🚀 Iniciando serviço de sincronização automática OMIE...');
    console.log(`⏱️  Intervalo: ${SYNC_INTERVAL / 1000 / 60} minutos`);
    
    // Executar primeira sincronização imediatamente
    this.runSync();
    
    // Agendar próximas sincronizações
    this.intervalId = setInterval(() => {
      this.runSync();
    }, SYNC_INTERVAL);
    
    console.log('✅ Serviço iniciado com sucesso!');
  }

  /**
   * Para o serviço de sincronização automática
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Serviço de sincronização automática parado.');
    }
  }

  /**
   * Executa a sincronização completa de forma sequencial
   */
  async runSync() {
    if (this.isRunning) {
      console.log('⚠️  Sincronização já em andamento, pulando esta execução...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();
    
    console.log('\n' + '='.repeat(60));
    console.log(`🔄 INICIANDO SINCRONIZAÇÃO OMIE - ${startTime.toLocaleString('pt-BR')}`);
    console.log('='.repeat(60));

    const results = {
      timestamp: startTime,
      clientes: null,
      produtos: null,
      pedidos: null,
      estoque: null,
      duration: null,
      success: false
    };

    try {
      // 1. Sincronizar Clientes
      console.log('\n📋 [1/4] Sincronizando Clientes...');
      try {
        const clientesStart = Date.now();
        const clientesRes = await axios.post(`${BACKEND_URL}/api/omie-internal/sync/clientes`);
        const clientesDuration = Date.now() - clientesStart;
        
        results.clientes = {
          success: true,
          ...clientesRes.data,
          duration: clientesDuration
        };
        
        console.log(`   ✅ Clientes sincronizados: ${clientesRes.data.total || 0} registros (${clientesDuration}ms)`);
      } catch (error) {
        results.clientes = {
          success: false,
          error: error.message
        };
        console.error(`   ❌ Erro ao sincronizar clientes: ${error.message}`);
      }

      // Aguardar 2 segundos entre sincronizações
      await this.sleep(2000);

      // 2. Sincronizar Produtos
      console.log('\n📦 [2/4] Sincronizando Produtos...');
      try {
        const produtosStart = Date.now();
        const produtosRes = await axios.post(`${BACKEND_URL}/api/omie-internal/sync/produtos`);
        const produtosDuration = Date.now() - produtosStart;
        
        results.produtos = {
          success: true,
          ...produtosRes.data,
          duration: produtosDuration
        };
        
        console.log(`   ✅ Produtos sincronizados: ${produtosRes.data.total || 0} registros (${produtosDuration}ms)`);
      } catch (error) {
        results.produtos = {
          success: false,
          error: error.message
        };
        console.error(`   ❌ Erro ao sincronizar produtos: ${error.message}`);
      }

      // Aguardar 2 segundos
      await this.sleep(2000);

      // 3. Sincronizar Pedidos
      console.log('\n🛒 [3/4] Sincronizando Pedidos...');
      try {
        const pedidosStart = Date.now();
        const pedidosRes = await axios.post(`${BACKEND_URL}/api/omie-internal/sync/pedidos`);
        const pedidosDuration = Date.now() - pedidosStart;
        
        results.pedidos = {
          success: true,
          ...pedidosRes.data,
          duration: pedidosDuration
        };
        
        console.log(`   ✅ Pedidos sincronizados: ${pedidosRes.data.total || 0} registros (${pedidosDuration}ms)`);
      } catch (error) {
        results.pedidos = {
          success: false,
          error: error.message
        };
        console.error(`   ❌ Erro ao sincronizar pedidos: ${error.message}`);
      }

      // Aguardar 2 segundos
      await this.sleep(2000);

      // 4. Sincronizar Estoque
      console.log('\n📊 [4/4] Sincronizando Estoque...');
      try {
        const estoqueStart = Date.now();
        const estoqueRes = await axios.post(`${BACKEND_URL}/api/omie-internal/sync/estoque`);
        const estoqueDuration = Date.now() - estoqueStart;
        
        results.estoque = {
          success: true,
          ...estoqueRes.data,
          duration: estoqueDuration
        };
        
        console.log(`   ✅ Estoque sincronizado: ${estoqueRes.data.total || 0} registros (${estoqueDuration}ms)`);
      } catch (error) {
        results.estoque = {
          success: false,
          error: error.message
        };
        console.error(`   ❌ Erro ao sincronizar estoque: ${error.message}`);
      }

      // Verificar se houve algum erro
      const hasErrors = !results.clientes?.success || 
                       !results.produtos?.success || 
                       !results.pedidos?.success || 
                       !results.estoque?.success;

      results.success = !hasErrors;

      const endTime = new Date();
      const totalDuration = endTime - startTime;
      results.duration = totalDuration;

      console.log('\n' + '='.repeat(60));
      if (results.success) {
        console.log(`✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO`);
      } else {
        console.log(`⚠️  SINCRONIZAÇÃO CONCLUÍDA COM ERROS`);
      }
      console.log(`⏱️  Duração total: ${(totalDuration / 1000).toFixed(2)}s`);
      console.log(`🕐 Próxima sincronização em: ${SYNC_INTERVAL / 1000 / 60} minutos`);
      console.log('='.repeat(60) + '\n');

    } catch (error) {
      console.error('\n❌ ERRO CRÍTICO NA SINCRONIZAÇÃO:', error.message);
      results.success = false;
      results.error = error.message;
    } finally {
      this.isRunning = false;
      this.lastSync = results;
      
      // Manter histórico das últimas 10 sincronizações
      this.syncHistory.unshift(results);
      if (this.syncHistory.length > 10) {
        this.syncHistory = this.syncHistory.slice(0, 10);
      }
    }
  }

  /**
   * Função auxiliar para aguardar (sleep)
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retorna o status do serviço
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: SYNC_INTERVAL / 1000 / 60,
      lastSync: this.lastSync,
      syncHistory: this.syncHistory.slice(0, 5) // Últimas 5 sincronizações
    };
  }
}

// Criar instância do serviço
const omieAutoSync = new OmieAutoSyncService();

console.log('🎯 Serviço de Sincronização Automática OMIE');
console.log('📍 Executando em modo standalone\n');

// Iniciar serviço
omieAutoSync.start();

// Tratar sinais de encerramento
process.on('SIGINT', () => {
  console.log('\n\n🛑 Recebido sinal de interrupção (CTRL+C)');
  omieAutoSync.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Recebido sinal de término');
  omieAutoSync.stop();
  process.exit(0);
});

// Manter processo rodando
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
  // Não encerrar o processo, apenas logar o erro
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  // Não encerrar o processo, apenas logar o erro
});
