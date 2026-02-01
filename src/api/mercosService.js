/**
 * Serviço de integração com MERCOS API
 * Documentação: https://mercos.docs.apiary.io/
 */

import axios from 'axios';

const MERCOS_BASE_URL = 'https://sandbox.mercos.com/api/v1';
const MERCOS_PRODUCTION_URL = 'https://api.mercos.com/api/v1';

/**
 * Classe para gerenciar integração com MERCOS
 */
class MercosService {
  constructor(applicationToken, companyToken, isProduction = false) {
    this.applicationToken = applicationToken;
    this.companyToken = companyToken;
    this.baseUrl = isProduction ? MERCOS_PRODUCTION_URL : MERCOS_BASE_URL;
    this.requestDelay = 1000; // 1 segundo entre requisições para evitar throttling
  }

  /**
   * Aguarda um tempo antes da próxima requisição (throttling)
   */
  async wait(ms = this.requestDelay) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Faz uma requisição para a API do MERCOS
   * @param {string} endpoint - Endpoint da API (ex: '/clientes')
   * @param {object} options - Opções da requisição
   * @returns {Promise<object>} - Resposta da API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'ApplicationToken': this.applicationToken,
      'CompanyToken': this.companyToken,
      ...options.headers
    };

    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers,
        data: options.body ? JSON.parse(options.body) : undefined,
        validateStatus: () => true // Não lança erro automaticamente
      });

      // Tratamento de throttling (HTTP 429)
      if (response.status === 429) {
        const waitTime = response.data.tempo_ate_permitir_novamente || 1;
        console.warn(`[MERCOS] Throttling detectado. Aguardando ${waitTime}s...`);
        await this.wait(waitTime * 1000);
        // Tenta novamente após aguardar
        return this.request(endpoint, options);
      }

      if (response.status >= 400) {
        throw new Error(`Erro na API MERCOS: ${response.status} - ${JSON.stringify(response.data)}`);
      }

      const data = response.data;
      
      // Verifica se há paginação
      const limitouRegistros = response.headers['meuspedidos_limitou_registros'];
      const qtdeTotal = response.headers['meuspedidos_qtde_total_registros'];
      const requisicoesExtras = response.headers['meuspedidos_requisicoes_extras'];

      return {
        data,
        pagination: {
          hasMore: limitouRegistros === '1',
          totalRecords: qtdeTotal ? parseInt(qtdeTotal) : null,
          extraRequests: requisicoesExtras ? parseInt(requisicoesExtras) : null
        }
      };
    } catch (error) {
      console.error('[MERCOS] Erro na requisição:', error.message);
      throw error;
    }
  }

  /**
   * Busca clientes com paginação automática
   * @param {string} alteradoApos - Data/hora no formato ISO 8601 (ex: '2024-01-01T00:00:00')
   * @returns {Promise<Array>} - Lista de clientes
   */
  async getClientes(alteradoApos = null) {
    let allClientes = [];
    let lastAlteracaoDate = alteradoApos || '2000-01-01T00:00:00';
    let hasMore = true;

    while (hasMore) {
      const endpoint = `/clientes?alterado_apos=${encodeURIComponent(lastAlteracaoDate)}`;
      const result = await this.request(endpoint);

      if (result.data && result.data.length > 0) {
        allClientes = allClientes.concat(result.data);
        
        // Atualiza a data para a próxima requisição
        const lastRecord = result.data[result.data.length - 1];
        if (lastRecord.ultima_alteracao) {
          lastAlteracaoDate = lastRecord.ultima_alteracao;
        }

        hasMore = result.pagination.hasMore;
        
        if (hasMore) {
          console.log(`[MERCOS] Buscando mais clientes... (${allClientes.length} até agora)`);
          await this.wait(); // Aguarda antes da próxima requisição
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`[MERCOS] Total de clientes obtidos: ${allClientes.length}`);
    return allClientes;
  }

  /**
   * Busca produtos com paginação automática
   * @param {string} alteradoApos - Data/hora no formato ISO 8601
   * @returns {Promise<Array>} - Lista de produtos
   */
  async getProdutos(alteradoApos = null) {
    let allProdutos = [];
    let lastAlteracaoDate = alteradoApos || '2000-01-01T00:00:00';
    let hasMore = true;

    while (hasMore) {
      const endpoint = `/produtos?alterado_apos=${encodeURIComponent(lastAlteracaoDate)}`;
      const result = await this.request(endpoint);

      if (result.data && result.data.length > 0) {
        allProdutos = allProdutos.concat(result.data);
        
        const lastRecord = result.data[result.data.length - 1];
        if (lastRecord.ultima_alteracao) {
          lastAlteracaoDate = lastRecord.ultima_alteracao;
        }

        hasMore = result.pagination.hasMore;
        
        if (hasMore) {
          console.log(`[MERCOS] Buscando mais produtos... (${allProdutos.length} até agora)`);
          await this.wait();
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`[MERCOS] Total de produtos obtidos: ${allProdutos.length}`);
    return allProdutos;
  }

  /**
   * Busca pedidos com paginação automática
   * @param {string} alteradoApos - Data/hora no formato ISO 8601
   * @returns {Promise<Array>} - Lista de pedidos
   */
  async getPedidos(alteradoApos = null) {
    let allPedidos = [];
    let lastAlteracaoDate = alteradoApos || '2000-01-01T00:00:00';
    let hasMore = true;

    while (hasMore) {
      const endpoint = `/pedidos?alterado_apos=${encodeURIComponent(lastAlteracaoDate)}`;
      const result = await this.request(endpoint);

      if (result.data && result.data.length > 0) {
        allPedidos = allPedidos.concat(result.data);
        
        const lastRecord = result.data[result.data.length - 1];
        if (lastRecord.ultima_alteracao) {
          lastAlteracaoDate = lastRecord.ultima_alteracao;
        }

        hasMore = result.pagination.hasMore;
        
        if (hasMore) {
          console.log(`[MERCOS] Buscando mais pedidos... (${allPedidos.length} até agora)`);
          await this.wait();
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`[MERCOS] Total de pedidos obtidos: ${allPedidos.length}`);
    return allPedidos;
  }

  /**
   * Cria um novo cliente
   * @param {object} clienteData - Dados do cliente
   * @returns {Promise<object>} - Cliente criado
   */
  async createCliente(clienteData) {
    const result = await this.request('/clientes', {
      method: 'POST',
      body: JSON.stringify(clienteData)
    });
    
    return result.data;
  }

  /**
   * Atualiza um cliente existente
   * @param {number} clienteId - ID do cliente no MERCOS
   * @param {object} clienteData - Dados atualizados
   * @returns {Promise<object>} - Cliente atualizado
   */
  async updateCliente(clienteId, clienteData) {
    const result = await this.request(`/clientes/${clienteId}`, {
      method: 'PUT',
      body: JSON.stringify(clienteData)
    });
    
    return result.data;
  }

  /**
   * Testa a conexão com a API
   * @returns {Promise<boolean>} - true se conectado
   */
  async testConnection() {
    try {
      await this.request('/token_auth_status');
      console.log('[MERCOS] Conexão estabelecida com sucesso!');
      return true;
    } catch (error) {
      console.error('[MERCOS] Falha na conexão:', error.message);
      return false;
    }
  }
}

export default MercosService;
