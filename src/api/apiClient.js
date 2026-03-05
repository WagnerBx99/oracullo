// Cliente de API para substituir Base44
const API_URL = window.location.origin + '/api';

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.accessToken;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Adicionar token de autenticação se existir
    if (this.accessToken && !options.skipAuth) {
      config.headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {



// --- INÍCIO DO LOG DE AUDITORIA ---
console.group("AUDITORIA FETCH: " + endpoint);
console.log("1. URL COMPLETA:", url);
console.log("2. HEADERS:", JSON.stringify(config.headers, null, 2));
console.log("3. PAYLOAD BRUTO:", config.body); 
console.groupEnd();
// --- FIM DO LOG DE AUDITORIA ---



      const response = await fetch(url, config);

      // Se receber 401 e tiver refresh token, tentar renovar
      if (response.status === 401 && this.refreshToken && !options.skipAuth) {
        const refreshed = await this.auth.refresh();
        if (refreshed) {
          // Tentar novamente com novo token
          config.headers['Authorization'] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, config);
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[API] Erro em ${endpoint}:`, error);
      throw error;
    }
  }

  // Integrações
  integracoes = {
    list: () => this.request('/integracoes'),

    get: (id) => this.request(`/integracoes/${id}`),

    create: (data) => this.request('/integracoes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    update: (id, data) => this.request(`/integracoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

    delete: (id) => this.request(`/integracoes/${id}`, {
      method: 'DELETE',
    }),
  };

  // Autenticação
  auth = {
    register: async (data) => {
      const result = await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true
      });
      if (result.success) {
        this.setTokens(result.accessToken, result.refreshToken);
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      return result;
    },

    login: async (data) => {
      const result = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true
      });
      if (result.success) {
        this.setTokens(result.accessToken, result.refreshToken);
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      return result;
    },

    refresh: async () => {
      try {
        const result = await this.request('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
          skipAuth: true
        });
        if (result.success) {
          this.accessToken = result.accessToken;
          localStorage.setItem('accessToken', result.accessToken);
          return true;
        }
        return false;
      } catch (error) {
        this.clearTokens();
        return false;
      }
    },

    logout: async () => {
      try {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      } finally {
        this.clearTokens();
      }
    },

    me: () => this.request('/auth/me'),

    isAuthenticated: () => this.isAuthenticated(),
  };

  // MERCOS
  mercos = {
    sync: (integracaoId, data) => this.request('/mercos/sync', {
      method: 'POST',
      body: JSON.stringify({ ...data, integracaoId }),
    }),

    test: (data) => this.request('/mercos/test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  };

  // Usuários
  usuarios = {
    list: () => this.request('/usuarios'),

    get: (id) => this.request(`/usuarios/${id}`),

    create: (data) => this.request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    update: (id, data) => this.request(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

    delete: (id) => this.request(`/usuarios/${id}`, {
      method: 'DELETE',
    }),

    convidar: (data) => this.request('/usuarios/convidar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  };

  // Perfis
  perfis = {
    list: () => this.request('/perfis'),

    get: (id) => this.request(`/perfis/${id}`),

    create: (data) => this.request('/perfis', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    update: (id, data) => this.request(`/perfis/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

    delete: (id) => this.request(`/perfis/${id}`, {
      method: 'DELETE',
    }),

    permissoes: () => this.request('/perfis/sistema/permissoes'),
  };

  // OMIE
  omie = {
    sync: (integracaoId, data) => this.request('/omie/sync', {
      method: 'POST',
      body: JSON.stringify({ ...data, integracaoId }),
    }),

    test: (data) => this.request('/omie/test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  };

  // Dashboard
  dashboard = {
    kpis: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/dashboard/kpis${query ? '?' + query : ''}`);
    },

    vendasPorFilial: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/dashboard/vendas-por-filial${query ? '?' + query : ''}`);
    },

    stats: () => this.request('/dashboard/stats'),

    vendasTimeline: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/dashboard/vendas-timeline${query ? '?' + query : ''}`);
    },

    topClientes: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/dashboard/top-clientes${query ? '?' + query : ''}`);
    },
  };

  // Relatórios
  relatorios = {
    vendasConsolidado: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/relatorios/vendas-consolidado${query ? '?' + query : ''}`);
    },

    updateSaleCommission: (id, data) => this.request(`/reports/sales/${id}/commission`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

    updateUnitCost: (id, data) => this.request(`/reports/sales/${id}/cost`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

    updateCheckColumn: (id, data) => this.request(`/reports/sales/${id}/check`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

    vendasTrading: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/relatorios/vendas-trading${query ? '?' + query : ''}`);
    },

    vendasPorVendedor: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/relatorios/vendas-por-vendedor${query ? '?' + query : ''}`);
    },

    clientesPorFilial: () => this.request('/relatorios/clientes-por-filial'),

    produtosMaisVendidos: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/relatorios/produtos-mais-vendidos${query ? '?' + query : ''}`);
    },

    resumoGeral: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/relatorios/resumo-geral${query ? '?' + query : ''}`);
    },

    faturamentoDiario: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/relatorios/faturamento-diario${query ? '?' + query : ''}`);
    },

    fechamentoComissoes: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/relatorios/fechamento-comissoes${query ? '?' + query : ''}`);
    },
  };

  // Produtos
  produtos = {
    list: () => this.request('/produtos'),

    stats: () => this.request('/produtos/stats'),
  };

  // Reports
  reports = {
    states: () => this.request('/reports/states'),
    sales: (state, params) => {
      const stateParam = Array.isArray(state) ? (state.length > 0 ? state.join(',') : 'all') : (state || 'all');
      const query = new URLSearchParams(params).toString();
      return this.request(`/reports/${encodeURIComponent(stateParam)}/sales${query ? '?' + query : ''}`);
    },
    consolidated: (state, params) => {
      const stateParam = Array.isArray(state) ? (state.length > 0 ? state.join(',') : 'all') : (state || 'all');
      const query = new URLSearchParams(params).toString();
      return this.request(`/reports/${encodeURIComponent(stateParam)}/consolidated${query ? '?' + query : ''}`);
    },
    dailyBilling: (state, params) => {
      const stateParam = Array.isArray(state) ? (state.length > 0 ? state.join(',') : 'all') : (state || 'all');
      const query = new URLSearchParams(params).toString();
      return this.request(`/reports/${encodeURIComponent(stateParam)}/daily-billing${query ? '?' + query : ''}`);
    },
    dailyBillingConsolidated: (state, params) => {
      const stateParam = Array.isArray(state) ? (state.length > 0 ? state.join(',') : 'all') : (state || 'all');
      const query = new URLSearchParams(params).toString();
      return this.request(`/reports/${encodeURIComponent(stateParam)}/daily-billing-consolidated${query ? '?' + query : ''}`);
    },
    annualConsolidated: (state, params) => {
      const stateParam = Array.isArray(state) ? (state.length > 0 ? state.join(',') : 'all') : (state || 'all');
      const query = new URLSearchParams(params).toString();
      return this.request(`/reports/${encodeURIComponent(stateParam)}/annual-consolidated${query ? '?' + query : ''}`);
    },
    filters: (state) => {
      const stateParam = Array.isArray(state) ? (state.length > 0 ? state.join(',') : 'all') : (state || 'all');
      return this.request(`/reports/${encodeURIComponent(stateParam)}/sales/filters`);
    },
    exportSalesStateUrl: (params) => {
      if (this.accessToken) params.token = this.accessToken;
      const query = new URLSearchParams(params).toString();
      return `${this.baseURL}/reports/export/sales-state${query ? '?' + query : ''}`;
    },
    exportConsolidatedStateUrl: (params) => {
      if (this.accessToken) params.token = this.accessToken;
      const query = new URLSearchParams(params).toString();
      return `${this.baseURL}/reports/export/consolidated-state${query ? '?' + query : ''}`;
    },
    exportAnnualConsolidatedUrl: (params) => {
      if (this.accessToken) params.token = this.accessToken;
      const query = new URLSearchParams(params).toString();
      return `${this.baseURL}/reports/export/annual-consolidated${query ? '?' + query : ''}`;
    },
    exportDailyBillingUrl: (params) => {
      if (this.accessToken) params.token = this.accessToken;
      const query = new URLSearchParams(params).toString();
      return `${this.baseURL}/reports/export/daily-billing${query ? '?' + query : ''}`;
    }
  };

  // Diretoria
  diretoria = {
    kpis: () => this.request('/diretoria/kpis'),

    faturamentoMensal: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/diretoria/faturamento-mensal${query ? '?' + query : ''}`);
    },

    comparativoTrimestral: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/diretoria/comparativo-trimestral${query ? '?' + query : ''}`);
    },

    distribuicaoReceita: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/diretoria/distribuicao-receita${query ? '?' + query : ''}`);
    },

    comissoes: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/diretoria/comissoes${query ? '?' + query : ''}`);
    },
    performance: () => this.request('/diretoria/performance'),
  };

  // Comercial
  comercial = {
    kpis: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/comercial/kpis${query ? '?' + query : ''}`);
    },

    vendasMensais: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/comercial/vendas-mensais${query ? '?' + query : ''}`);
    },

    pipeline: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/comercial/pipeline${query ? '?' + query : ''}`);
    },

    topProdutos: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/comercial/top-produtos${query ? '?' + query : ''}`);
    },

    vendedores: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/comercial/vendedores${query ? '?' + query : ''}`);
    },
  };

  // Operacional
  operacional = {
    kpis: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/operacional/kpis${query ? '?' + query : ''}`);
    },

    producaoSemanal: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/operacional/producao-semanal${query ? '?' + query : ''}`);
    },

    entregasPeriodo: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/operacional/entregas-periodo${query ? '?' + query : ''}`);
    },

    estoque: () => {
      return this.request('/operacional/estoque');
    },
  };

  // Clientes
  clientes = {
    list: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/clientes${query ? '?' + query : ''}`);
    },

    unificados: (params) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/clientes/unificados${query ? '?' + query : ''}`);
    },

    stats: () => this.request('/clientes/unificados/stats'),

    unificar: () => this.request('/clientes/unificar', {
      method: 'POST',
    }),

    detalhes: (id) => this.request(`/clientes/unificados/${id}`),
  };
}

export const api = new ApiClient();
export default api;
