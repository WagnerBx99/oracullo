import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário salvo no localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, senha) => {
    const result = await api.auth.login({ email, senha });
    setUser(result.user);
    return result;
  };

  const register = async (nome, email, senha) => {
    const result = await api.auth.register({ nome, email, senha });
    setUser(result.user);
    return result;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user && api.auth.isAuthenticated();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
