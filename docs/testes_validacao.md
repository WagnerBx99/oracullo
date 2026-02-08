# Testes e Validação do Sistema Oracullo

## 📋 Checklist de Testes

### ✅ **1. Testes de Backend**

#### 1.1. Conexões com Bancos de Dados
- [ ] Conexão com `oracullo_gestao` funcionando
- [ ] Conexão com `oracullo_transacional` funcionando
- [ ] Conexão com `oracullo_analitico` funcionando
- [ ] dblink entre bancos funcionando

#### 1.2. Endpoints de Dashboard
- [ ] `GET /api/dashboard/kpis` retorna dados corretos
- [ ] `GET /api/dashboard/vendas-por-filial` retorna vendas agrupadas
- [ ] `GET /api/dashboard/stats` retorna estatísticas gerais
- [ ] `GET /api/dashboard/vendas-timeline` retorna evolução de vendas
- [ ] `GET /api/dashboard/top-clientes` retorna top clientes

#### 1.3. Endpoints de Relatórios
- [ ] `GET /api/relatorios/vendas-consolidado` retorna vendas por estado/filial
- [ ] `GET /api/relatorios/vendas-trading` retorna vendas de trading
- [ ] `GET /api/relatorios/vendas-por-vendedor` retorna estrutura preparada
- [ ] `GET /api/relatorios/clientes-por-filial` retorna distribuição de clientes
- [ ] `GET /api/relatorios/produtos-mais-vendidos` retorna produtos
- [ ] `GET /api/relatorios/resumo-geral` retorna resumo do período

#### 1.4. Endpoints de Clientes
- [ ] `GET /api/clientes/unificados` retorna clientes unificados
- [ ] `GET /api/clientes/unificados/stats` retorna estatísticas
- [ ] `POST /api/clientes/unificar` executa unificação
- [ ] `GET /api/clientes/unificados/:id` retorna detalhes + registros por filial

#### 1.5. Filtros e Parâmetros
- [ ] Filtro por período (data_inicio, data_fim) funciona
- [ ] Filtro por filial (filial_id) funciona
- [ ] Filtro por quantidade de meses funciona
- [ ] Parâmetros opcionais funcionam corretamente

---

### ✅ **2. Testes de Frontend**

#### 2.1. Dashboard
- [ ] Cards de estatísticas carregam dados reais
- [ ] KPIs principais exibem valores corretos
- [ ] Vendas por filial são exibidas corretamente
- [ ] Timeline de vendas renderiza gráfico
- [ ] Loading states funcionam
- [ ] Auto-refresh a cada 1 minuto funciona
- [ ] Botão "Sincronizar Dados" atualiza queries

#### 2.2. Relatórios
- [ ] Filtros de data funcionam
- [ ] Filtro de filial funciona
- [ ] Tab "Vendas Consolidado" exibe dados por estado/filial
- [ ] Tab "Trading" exibe vendas de distribuição
- [ ] Tab "Clientes" exibe distribuição por filial
- [ ] Exportação para Excel funciona com dados reais
- [ ] Totalizadores calculam corretamente
- [ ] Loading states funcionam

#### 2.3. Integrações
- [ ] Lista de integrações carrega do banco
- [ ] Status das integrações é exibido corretamente
- [ ] Sincronização OMIE funciona
- [ ] Última sincronização é atualizada

#### 2.4. Usuários e Permissões
- [ ] Lista de usuários carrega do banco
- [ ] CRUD de usuários funciona
- [ ] CRUD de perfis funciona
- [ ] Atribuição de permissões funciona

---

### ✅ **3. Testes de Integração**

#### 3.1. Fluxo Completo de Dados
- [ ] Clientes sincronizados da OMIE aparecem no DB Transacional
- [ ] Clientes são unificados no DB Analítico
- [ ] Vendas de exemplo são exibidas nos relatórios
- [ ] KPIs de exemplo são exibidos no dashboard
- [ ] Filtros alteram os dados exibidos corretamente

#### 3.2. Stored Procedures
- [ ] `unificar_clientes()` executa sem erros
- [ ] Consolidação por CPF/CNPJ funciona
- [ ] Merge de dados funciona corretamente
- [ ] Rastreamento de filiais funciona

#### 3.3. Sistema de Dados Exemplo
- [ ] Tabela `dados_exemplo` rastreia todos os dados
- [ ] Função `registrar_dado_exemplo()` funciona
- [ ] Dados de exemplo podem ser identificados

---

### ✅ **4. Testes de Performance**

#### 4.1. Queries
- [ ] Query de KPIs executa em < 1s
- [ ] Query de vendas por filial executa em < 2s
- [ ] Query de clientes unificados executa em < 3s
- [ ] Queries com dblink não travam

#### 4.2. Frontend
- [ ] Página Dashboard carrega em < 3s
- [ ] Página Relatórios carrega em < 3s
- [ ] Filtros respondem em < 1s
- [ ] Exportação Excel executa em < 5s

---

### ✅ **5. Testes de Segurança**

#### 5.1. Autenticação
- [ ] Rotas protegidas exigem token
- [ ] Token expirado retorna 401
- [ ] Refresh token funciona
- [ ] Logout limpa tokens

#### 5.2. Autorização
- [ ] Permissões são verificadas
- [ ] Usuários sem permissão não acessam recursos
- [ ] Perfis limitam acesso corretamente

#### 5.3. Validações
- [ ] Inputs são validados no backend
- [ ] SQL injection é prevenido (queries parametrizadas)
- [ ] Senhas são hasheadas com bcrypt
- [ ] Emails são validados

---

## 🧪 Comandos de Teste

### Testar Endpoints Manualmente

```bash
# Health check
curl http://localhost:3001/health

# Stats do dashboard (requer autenticação)
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3001/api/dashboard/stats

# KPIs do mês atual
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3001/api/dashboard/kpis

# Vendas por filial
curl -H "Authorization: Bearer SEU_TOKEN" \
  "http://localhost:3001/api/dashboard/vendas-por-filial?data_inicio=2026-01-01&data_fim=2026-01-31"

# Vendas consolidado
curl -H "Authorization: Bearer SEU_TOKEN" \
  "http://localhost:3001/api/relatorios/vendas-consolidado?data_inicio=2026-01-01&data_fim=2026-01-31"

# Clientes unificados
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3001/api/clientes/unificados

# Estatísticas de clientes
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3001/api/clientes/unificados/stats
```

### Testar Queries no PostgreSQL

```bash
# Conectar ao DB Analítico
PGPASSWORD=oracullo123 psql -h localhost -U oracullo_user -d oracullo_analitico

# Verificar KPIs
SELECT * FROM kpis_consolidados ORDER BY periodo DESC LIMIT 5;

# Verificar vendas
SELECT * FROM vendas_por_periodo ORDER BY periodo DESC LIMIT 10;

# Verificar clientes unificados
SELECT COUNT(*) as total, 
       COUNT(*) FILTER (WHERE total_registros > 1) as multiplas_filiais
FROM clientes_unificados;

# Verificar dados de exemplo
SELECT tabela, COUNT(*) as registros
FROM dados_exemplo
GROUP BY tabela;
```

### Testar Stored Procedures

```bash
# Executar unificação de clientes
PGPASSWORD=oracullo123 psql -h localhost -U oracullo_user -d oracullo_analitico \
  -c "SELECT * FROM unificar_clientes();"

# Verificar resultado
PGPASSWORD=oracullo123 psql -h localhost -U oracullo_user -d oracullo_analitico \
  -c "SELECT COUNT(*) FROM clientes_unificados;"
```

---

## 📊 Resultados Esperados

### Dados no Sistema

| Métrica | Valor Esperado |
|---------|----------------|
| Total de Clientes (Transacional) | 5.114 |
| Clientes Unificados (Analítico) | ~4.899 |
| Clientes em Múltiplas Filiais | ~215 |
| Integrações Cadastradas | 9 |
| Integrações Ativas | 9 |
| Vendas por Período (exemplo) | 96 |
| KPIs Consolidados (exemplo) | 3 |
| Produtos | 0 (OMIE sem produtos) |

### Performance Esperada

| Operação | Tempo Esperado |
|----------|----------------|
| Load Dashboard | < 3s |
| Load Relatórios | < 3s |
| Query KPIs | < 1s |
| Query Vendas | < 2s |
| Unificar Clientes | < 5s |
| Exportar Excel | < 5s |

---

## ⚠️ Problemas Conhecidos

1. **Produtos OMIE:** API não retorna produtos apesar de mostrar no painel
   - **Status:** Investigar endpoint ou permissões da API
   - **Workaround:** Endpoints preparados para quando houver dados

2. **Vendedores:** Não temos dados de vendedores ainda
   - **Status:** Aguardando sincronização de pedidos
   - **Workaround:** Endpoint retorna estrutura vazia com mensagem

3. **Dados de Exemplo:** Sistema usa dados de exemplo para demonstração
   - **Status:** Normal, rastreados na tabela `dados_exemplo`
   - **Ação:** Remover quando houver dados reais suficientes

---

## ✅ Critérios de Aceitação

### Mínimo para Produção

- ✅ Todos os endpoints retornam 200 OK
- ✅ Dashboard carrega sem erros
- ✅ Relatórios carregam sem erros
- ✅ Filtros funcionam corretamente
- ✅ Exportação Excel funciona
- ✅ Dados reais são exibidos (não mockados)
- ✅ Loading states funcionam
- ✅ Auto-refresh funciona
- ✅ Autenticação funciona
- ✅ Backend reinicia sem erros

### Desejável para Produção

- ⏳ Performance < 3s em todas as páginas
- ⏳ Testes automatizados implementados
- ⏳ Logs estruturados
- ⏳ Monitoramento de erros
- ⏳ Backup automático dos bancos
- ⏳ SSL/HTTPS configurado

---

## 📝 Notas de Teste

### Ambiente de Teste
- **OS:** Ubuntu 22.04
- **Node.js:** v22.13.0
- **PostgreSQL:** 14+
- **PM2:** Latest
- **Navegador:** Chrome/Firefox/Safari

### Dados de Teste
- Usar período: 2026-01-01 a 2026-01-31
- Usar filial: Blumenau (ID 1)
- Usar usuário de teste com permissões completas

### Logs Importantes
```bash
# Logs do backend
pm2 logs oracullo-backend

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Logs do sistema
sudo journalctl -u nginx -f
```

---

## 🎯 Próximos Passos Após Testes

1. Corrigir bugs encontrados
2. Otimizar queries lentas
3. Adicionar testes automatizados
4. Configurar monitoramento
5. Documentar APIs (Swagger/OpenAPI)
6. Implementar cache (Redis)
7. Adicionar mais dados de exemplo
8. Treinar usuários finais
