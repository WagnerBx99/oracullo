#!/bin/bash

# Script de Deploy e Testes na VPS
# Executa git pull, instala dependências, testa conexões e reinicia serviços

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy na VPS..."
echo ""

# 1. Git Pull
echo "📥 Atualizando código do repositório..."
cd /var/www/oracullo_LuizGouveia
git pull origin main
echo "✅ Código atualizado"
echo ""

# 2. Instalar dependências do backend (se houver novas)
echo "📦 Verificando dependências do backend..."
cd /var/www/oracullo_LuizGouveia/backend
npm install --production
echo "✅ Dependências do backend verificadas"
echo ""

# 3. Testar conexões com os bancos de dados
echo "🔌 Testando conexões com bancos de dados..."

# Testar DB Gestão
echo "  - Testando oracullo_gestao..."
PGPASSWORD=oracullo123 psql -h localhost -U oracullo_user -d oracullo_gestao -c "SELECT COUNT(*) as total FROM integracoes;" -t

# Testar DB Transacional
echo "  - Testando oracullo_transacional..."
PGPASSWORD=oracullo123 psql -h localhost -U oracullo_user -d oracullo_transacional -c "SELECT COUNT(*) as total FROM clientes;" -t

# Testar DB Analítico
echo "  - Testando oracullo_analitico..."
PGPASSWORD=oracullo123 psql -h localhost -U oracullo_user -d oracullo_analitico -c "SELECT COUNT(*) as total FROM clientes_unificados;" -t

echo "✅ Todas as conexões com bancos de dados OK"
echo ""

# 4. Verificar se stored procedures existem
echo "🔧 Verificando stored procedures..."
PGPASSWORD=oracullo123 psql -h localhost -U oracullo_user -d oracullo_analitico -c "\df unificar_clientes" -t | grep -q "unificar_clientes" && echo "  ✅ unificar_clientes() existe" || echo "  ⚠️  unificar_clientes() não encontrada"
echo ""

# 5. Verificar dados de exemplo
echo "📊 Verificando dados de exemplo..."
VENDAS_COUNT=$(PGPASSWORD=oracullo123 psql -h localhost -U oracullo_user -d oracullo_analitico -c "SELECT COUNT(*) FROM vendas_por_periodo;" -t | tr -d ' ')
KPIS_COUNT=$(PGPASSWORD=oracullo123 psql -h localhost -U oracullo_user -d oracullo_analitico -c "SELECT COUNT(*) FROM kpis_consolidados;" -t | tr -d ' ')
echo "  - Vendas por período: $VENDAS_COUNT registros"
echo "  - KPIs consolidados: $KPIS_COUNT registros"
echo ""

# 6. Reiniciar backend
echo "🔄 Reiniciando backend..."
pm2 restart oracullo-backend
sleep 3
echo "✅ Backend reiniciado"
echo ""

# 7. Verificar status do backend
echo "📊 Status do backend:"
pm2 status oracullo-backend
echo ""

# 8. Testar health check
echo "🏥 Testando health check..."
curl -s http://localhost:3001/health | jq '.'
echo ""

# 9. Build do frontend (se necessário)
echo "🎨 Verificando se precisa rebuild do frontend..."
cd /var/www/oracullo_LuizGouveia
if [ -f "package.json" ]; then
  echo "  - Instalando dependências do frontend..."
  npm install
  echo "  - Fazendo build do frontend..."
  npm run build
  echo "✅ Frontend atualizado"
else
  echo "  ⚠️  package.json não encontrado, pulando build"
fi
echo ""

# 10. Resumo final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Estatísticas:"
echo "  - Clientes: $(PGPASSWORD=oracullo123 psql -h localhost -U oracullo_user -d oracullo_transacional -c 'SELECT COUNT(*) FROM clientes;' -t | tr -d ' ')"
echo "  - Clientes Unificados: $(PGPASSWORD=oracullo123 psql -h localhost -U oracullo_user -d oracullo_analitico -c 'SELECT COUNT(*) FROM clientes_unificados;' -t | tr -d ' ')"
echo "  - Integrações: $(PGPASSWORD=oracullo123 psql -h localhost -U oracullo_user -d oracullo_gestao -c 'SELECT COUNT(*) FROM integracoes;' -t | tr -d ' ')"
echo "  - Vendas (exemplo): $VENDAS_COUNT"
echo "  - KPIs (exemplo): $KPIS_COUNT"
echo ""
echo "🌐 Acesse o sistema em: http://SEU_IP_VPS"
echo ""
