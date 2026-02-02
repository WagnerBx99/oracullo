import express from 'express';
import { Usuario } from '../models/Usuario.js';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  getRefreshTokenExpiration 
} from '../utils/jwt.js';

const router = express.Router();

// Registro de novo usuário
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Validar campos
    if (!nome || !email || !senha) {
      return res.status(400).json({
        error: 'Campos obrigatórios: nome, email, senha'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }

    // Validar senha (mínimo 6 caracteres)
    if (senha.length < 6) {
      return res.status(400).json({
        error: 'Senha deve ter no mínimo 6 caracteres'
      });
    }

    // Verificar se email já existe
    const usuarioExistente = await Usuario.findByEmail(email);
    if (usuarioExistente) {
      return res.status(409).json({
        error: 'Email já cadastrado'
      });
    }

    // Criar usuário
    const usuario = await Usuario.create({ nome, email, senha });

    // Gerar tokens
    const accessToken = generateAccessToken(usuario);
    const refreshToken = generateRefreshToken(usuario);

    // Salvar refresh token no banco
    await Usuario.saveRefreshToken(
      usuario.id, 
      refreshToken, 
      getRefreshTokenExpiration()
    );

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('[Auth] Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validar campos
    if (!email || !senha) {
      return res.status(400).json({
        error: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário
    const usuario = await Usuario.findByEmail(email);
    if (!usuario) {
      return res.status(401).json({
        error: 'Email ou senha incorretos'
      });
    }

    // Verificar se usuário está ativo
    if (!usuario.ativo) {
      return res.status(403).json({
        error: 'Usuário desativado'
      });
    }

    // Verificar senha
    const senhaValida = await Usuario.verifyPassword(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({
        error: 'Email ou senha incorretos'
      });
    }

    // Atualizar último login
    await Usuario.updateLastLogin(usuario.id);

    // Gerar tokens
    const accessToken = generateAccessToken(usuario);
    const refreshToken = generateRefreshToken(usuario);

    // Salvar refresh token no banco
    await Usuario.saveRefreshToken(
      usuario.id, 
      refreshToken, 
      getRefreshTokenExpiration()
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('[Auth] Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token é obrigatório'
      });
    }

    // Verificar JWT
    verifyRefreshToken(refreshToken);

    // Verificar se token está no banco e não foi revogado
    const tokenData = await Usuario.verifyRefreshToken(refreshToken);
    if (!tokenData) {
      return res.status(401).json({
        error: 'Refresh token inválido ou expirado'
      });
    }

    // Gerar novo access token
    const accessToken = generateAccessToken({
      id: tokenData.usuario_id,
      nome: tokenData.nome,
      email: tokenData.email
    });

    res.json({
      success: true,
      accessToken
    });

  } catch (error) {
    console.error('[Auth] Erro no refresh:', error);
    res.status(401).json({ error: 'Refresh token inválido' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revogar refresh token
      await Usuario.revokeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    console.error('[Auth] Erro no logout:', error);
    res.status(500).json({ error: 'Erro ao fazer logout' });
  }
});

// Verificar se usuário está autenticado (rota protegida de exemplo)
router.get('/me', async (req, res) => {
  try {
    // O middleware de autenticação já validou o token e adicionou req.user
    const usuario = await Usuario.findById(req.user.id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      success: true,
      user: usuario
    });

  } catch (error) {
    console.error('[Auth] Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

export default router;
