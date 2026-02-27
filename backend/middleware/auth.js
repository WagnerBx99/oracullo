import { verifyAccessToken } from '../utils/jwt.js';

// Middleware para verificar autenticação
export function authenticate(req, res, next) {
  try {
    // 1. Tentar pegar token do header Authorization
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    // 2. Se não veio no header, tentar da query string (útil p/ downloads do Excel via href/window.open)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        error: 'Token não fornecido',
        message: 'Você precisa estar autenticado para acessar este recurso'
      });
    }

    // Verificar token
    const decoded = verifyAccessToken(token);

    // Adicionar dados do usuário na requisição
    req.user = {
      id: decoded.id,
      email: decoded.email,
      nome: decoded.nome
    };

    next();

  } catch (error) {
    console.error('[Auth Middleware] Erro:', error.message);
    return res.status(401).json({
      error: 'Token inválido ou expirado',
      message: 'Faça login novamente'
    });
  }
}

// Middleware opcional (não bloqueia se não tiver token)
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');

      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const decoded = verifyAccessToken(token);

        req.user = {
          id: decoded.id,
          email: decoded.email,
          nome: decoded.nome
        };
      }
    }

    next();

  } catch (error) {
    // Ignora erro e continua sem autenticação
    next();
  }
}
