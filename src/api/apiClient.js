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
}

export const api = new ApiClient();
export default api;
