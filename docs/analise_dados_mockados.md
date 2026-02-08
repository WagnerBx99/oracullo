# Análise de Dados Mockados no Sistema Oracullo

## 📋 Objetivo
Identificar todos os dados mockados no frontend e substituí-los por consultas reais aos bancos de dados.

---

## 🔍 Dados Mockados Identificados

### 1. **Dashboard.jsx** (Página Principal)
**Localização:** `/src/pages/Dashboard.jsx`

**Dados Mockados:**
- ✅ `produtos = []` - Query retorna array vazio (linhas 20-24)
- ✅ `integracoes = []` - Query retorna array vazio (linhas 26-30)
- ✅ `kpis = []` - Query retorna array vazio (linhas 32-36)

**Métricas Calculadas (baseadas em dados vazios):**
- Total de Produtos
- Custo Médio
- Margem Média
- Produtos com Novo Preço

**Ação Necessária:**
- Criar endpoint `/api/dashboard/kpis` para retornar KPIs consolidados
- Criar endpoint `/api/dashboard/vendas` para retornar dados de vendas
- Conectar queries do React Query aos endpoints reais

---

### 2. **Relatorios.jsx** (Página de Relatórios)
**Localização:** `/src/pages/Relatorios.jsx`

**Dados Mockados:**
- ❌ `dadosConsolidado` - Array hardcoded com vendas por estado/filial/vendedor (linhas 23-128)
  - 5 estados (SC, PR, MG, SP, DF)
  - 9 filiais
  - ~25 vendedores
  - Valores de vendas mockados
  
- ❌ `dadosTrading` - Array hardcoded com vendas de trading/distribuição (linhas 130-136)
  - 5 distribuidores
  - Valores mockados

**Totalizadores Calculados:**
- Total Geral (soma de estados)
- Total Trading
- Faturamento Total

**Ação Necessária:**
- Criar endpoint `/api/relatorios/vendas-consolidado` 
- Criar endpoint `/api/relatorios/vendas-trading`
- Implementar filtros por período e filial
- Conectar ao DB Analítico (tabela `vendas_por_periodo`)

---

### 3. **ConsolidacaoSistemas.jsx** (Componente)
**Localização:** `/src/components/dashboard/ConsolidacaoSistemas.jsx`

**Dados Mockados:**
- ⚠️ `sistemasConfig` - Configuração estática de sistemas (linhas 17-22)
  - OMIE, WK, Mercos, Clic
  - Tipos e cores

**Dados Reais Já Conectados:**
- ✅ `integracoes` - Vem do banco via props (tabela `integracoes`)

**Ação Necessária:**
- Nenhuma - Componente já usa dados reais da tabela `integracoes`
- `sistemasConfig` é apenas configuração visual (OK manter hardcoded)

---

## 📊 Estrutura de Dados Disponível

### **DB Analítico (oracullo_analitico)**

#### Tabela: `kpis_consolidados`
```sql
- id
- periodo (date)
- receita_total (numeric)
- lucro_liquido (numeric)
- margem_liquida (numeric)
- ticket_medio (numeric)
- total_pedidos (integer)
- total_clientes (integer)
- criado_em (timestamp)
```

#### Tabela: `vendas_por_periodo`
```sql
- id
- integracao_id (FK)
- periodo (date)
- total_vendas (numeric)
- total_pedidos (integer)
- ticket_medio (numeric)
- criado_em (timestamp)
```

#### Tabela: `clientes_unificados`
```sql
- id
- cpf_cnpj (unique)
- nome_razao_social
- nome_fantasia
- email
- telefone
- cidade
- estado
- filiais (jsonb) - array de integracao_id
- total_registros (integer)
- criado_em (timestamp)
```

### **DB Transacional (oracullo_transacional)**

#### Tabela: `clientes`
```sql
- id
- integracao_id (FK)
- codigo_externo
- nome_razao_social
- nome_fantasia
- cpf_cnpj
- email
- telefone
- endereco
- cidade
- estado
- cep
- data_cadastro
- ativo (boolean)
```

#### Tabela: `produtos`
```sql
- id
- integracao_id (FK)
- codigo_externo
- descricao
- unidade
- preco_venda (numeric)
- custo (numeric)
- estoque (numeric)
- ativo (boolean)
```

### **DB Gestão (oracullo_gestao)**

#### Tabela: `integracoes`
```sql
- id
- sistema (omie, wk, mercos, clic)
- nome
- filial
- status
- config (jsonb)
- ultima_sincronizacao (timestamp)
```

---

## 🎯 Endpoints a Criar

### 1. **Dashboard KPIs**
```
GET /api/dashboard/kpis
Query Params: ?periodo=2026-01&filial_id=1

Response:
{
  "periodo": "2026-01",
  "receita_total": 150000.00,
  "lucro_liquido": 45000.00,
  "margem_liquida": 30.0,
  "ticket_medio": 1250.00,
  "total_pedidos": 120,
  "total_clientes": 85,
  "variacao_receita": 15.5,
  "variacao_lucro": 8.2
}
```

### 2. **Vendas por Filial**
```
GET /api/dashboard/vendas-por-filial
Query Params: ?data_inicio=2026-01-01&data_fim=2026-01-31

Response:
{
  "periodo": { "inicio": "2026-01-01", "fim": "2026-01-31" },
  "filiais": [
    {
      "integracao_id": 1,
      "nome": "Blumenau",
      "estado": "SC",
      "total_vendas": 63537.00,
      "total_pedidos": 45,
      "ticket_medio": 1412.04
    },
    ...
  ],
  "total_geral": 150000.00
}
```

### 3. **Vendas Consolidado (Relatórios)**
```
GET /api/relatorios/vendas-consolidado
Query Params: ?data_inicio=2026-01-01&data_fim=2026-01-31&filial_id=1

Response:
{
  "periodo": { "inicio": "2026-01-01", "fim": "2026-01-31" },
  "estados": [
    {
      "estado": "Santa Catarina",
      "filiais": [
        {
          "nome": "Blumenau",
          "vendedores": [
            {
              "nome": "Edson Melo",
              "total": 18545.54,
              "pedidos": 12
            },
            ...
          ],
          "total": 63537.00
        },
        ...
      ],
      "total_estado": 82877.62
    },
    ...
  ],
  "total_geral": 150000.00
}
```

### 4. **Estatísticas Gerais**
```
GET /api/dashboard/stats

Response:
{
  "total_clientes": 4899,
  "total_clientes_unificados": 4684,
  "clientes_multiplas_filiais": 215,
  "total_produtos": 0,
  "total_integracoes": 9,
  "integracoes_ativas": 9,
  "ultima_sincronizacao": "2026-02-08T10:30:00Z"
}
```

---

## 📝 Plano de Implementação

### **Fase 1: Backend - Criar Endpoints de KPIs**
1. ✅ Criar `/backend/routes/dashboard.js`
2. ✅ Implementar queries ao DB Analítico
3. ✅ Adicionar filtros por período e filial
4. ✅ Calcular variações percentuais

### **Fase 2: Backend - Criar Endpoints de Relatórios**
1. ✅ Criar `/backend/routes/relatorios.js`
2. ✅ Implementar queries complexas com JOINs
3. ✅ Agrupar por estado/filial/vendedor
4. ✅ Adicionar exportação para Excel

### **Fase 3: Frontend - Conectar Dashboard**
1. ✅ Atualizar queries em `Dashboard.jsx`
2. ✅ Conectar StatsCards aos dados reais
3. ✅ Implementar loading states
4. ✅ Adicionar tratamento de erros

### **Fase 4: Frontend - Conectar Relatórios**
1. ✅ Atualizar queries em `Relatorios.jsx`
2. ✅ Remover dados mockados
3. ✅ Conectar filtros aos endpoints
4. ✅ Manter funcionalidade de exportação

### **Fase 5: Testes e Validação**
1. ✅ Testar todos os endpoints
2. ✅ Validar cálculos de totalizadores
3. ✅ Verificar performance das queries
4. ✅ Testar filtros e exportações

---

## ⚠️ Observações Importantes

1. **Dados de Exemplo Populados:**
   - Já temos 3 períodos de KPIs no DB Analítico
   - Já temos 96 registros de vendas (8 filiais × 12 meses)
   - Todos rastreados na tabela `dados_exemplo`

2. **Clientes Reais:**
   - 5.114 clientes sincronizados da OMIE
   - 4.899 clientes unificados (sem duplicatas)
   - 215 clientes em múltiplas filiais

3. **Produtos:**
   - 0 produtos (OMIE não retornou produtos)
   - Endpoint pronto para quando houver dados

4. **Integrações:**
   - 9 integrações cadastradas
   - Todas ativas e funcionais
   - OMIE totalmente integrado

---

## ✅ Próximos Passos

1. Criar arquivo `/backend/routes/dashboard.js`
2. Criar arquivo `/backend/routes/relatorios.js`
3. Registrar rotas no `server.js`
4. Atualizar `apiClient.js` no frontend
5. Atualizar componentes para usar dados reais
6. Testar e validar
7. Commit atômico de cada etapa
