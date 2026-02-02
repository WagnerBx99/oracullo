# Backend Oracullo - API de Integrações

Backend Node.js para gerenciar integrações com ERP e CRM (MERCOS, OMIE, WK Radar, CLIC).

## 🚀 Instalação

```bash
cd backend
npm install
```

## 🔧 Configuração

Edite o arquivo `.env`:

```env
PORT=3001
BASE44_APP_ID=6940b3ae4a4fb3a0460f9930
BASE44_API_KEY=5f3d84ca05c74745a067151476e89113
BASE44_BACKEND_URL=https://app.base44.com
```

## 📡 Endpoints

### MERCOS

**POST `/api/mercos/sync`**

Sincroniza dados do MERCOS (clientes, produtos ou pedidos).

```json
{
  "api_url": "https://sandbox.mercos.com/api/v1",
  "api_key": "seu-api-key",
  "company_token": "seu-company-token",
  "tipo": "clientes"
}
```

**POST `/api/mercos/test`**

Testa conexão com MERCOS.

```json
{
  "api_url": "https://sandbox.mercos.com/api/v1",
  "api_key": "seu-api-key",
  "company_token": "seu-company-token"
}
```

### Health Check

**GET `/health`**

Verifica se o servidor está rodando.

## 🏃 Executar

### Desenvolvimento

```bash
npm run dev
```

### Produção (VPS)

```bash
# Instalar PM2 globalmente (se não tiver)
sudo npm install -g pm2

# Iniciar backend
pm2 start ecosystem.config.cjs

# Ver logs
pm2 logs oracullo-backend

# Reiniciar
pm2 restart oracullo-backend

# Parar
pm2 stop oracullo-backend
```

## 🌐 Nginx (Proxy Reverso)

Adicione ao arquivo de configuração do Nginx (`/etc/nginx/sites-available/pecmotors.online`):

```nginx
location /api/ {
    proxy_pass http://localhost:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Depois reinicie o Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 📝 Logs

Logs ficam em `backend/logs/`:
- `out.log` - Saída padrão
- `err.log` - Erros
- `combined.log` - Tudo junto
