import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import mercosRoutes from './routes/mercos.js';
import omieRoutes from './routes/omie.js';
import omieInternalRoutes from './routes/omie-internal.js';
import comercialRoutes from "./routes/comercial.js";
import usuariosRoutes from './routes/usuarios.js';
import perfisRoutes from './routes/perfis.js';
import integracoesRoutes from './routes/integracoes.js';
import clientesRoutes from './routes/clientes.js';
import dashboardRoutes from './routes/dashboard.js';
import relatoriosRoutes from './routes/relatorios.js';
import diretoriaRoutes from './routes/diretoria.js';
import produtosRoutes from './routes/produtos.js';
import operacionalRoutes from './routes/operacional.js';
import authRoutes from './routes/auth.js';
import reportsRoutes from './routes/reports.js';
import { authenticate } from './middleware/auth.js';
import { testConnections } from './config/databases.js';



// No topo com os outros imports
import testRouter from './routes/test_debug.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Rotas públicas
app.use('/api/auth', authRoutes);
app.use('/api/omie-internal', omieInternalRoutes); // Rotas internas sem autenticação

// Rotas protegidas (requerem autenticação)
app.use('/api/integracoes', authenticate, integracoesRoutes);
app.use('/api/mercos', authenticate, mercosRoutes);
app.use('/api/omie', authenticate, omieRoutes);
app.use("/api/comercial", comercialRoutes);
app.use('/api/usuarios', authenticate, usuariosRoutes);
app.use('/api/perfis', authenticate, perfisRoutes);
app.use('/api/clientes', authenticate, clientesRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/relatorios', authenticate, relatoriosRoutes);
app.use('/api/diretoria', authenticate, diretoriaRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/produtos', authenticate, produtosRoutes);
app.use("/api/operacional", operacionalRoutes);

// No meio com os outros app.use
app.use('/api/test', testRouter);


// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  await testConnections();
});
