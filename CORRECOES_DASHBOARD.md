# Correções Aplicadas - Dashboard Cards Zerados

## 🎯 Problema Identificado

Os 4 cards do Dashboard Consolidado estavam exibindo valores zerados, apesar de haver **16.402 clientes**, **36.702 pedidos** e **7 integrações ativas** no banco de dados.

---

## 🔍 Causa Raiz

### Erro 1: Coluna "ativo" não existe
**Arquivo**: `backend/routes/dashboard.js`
**Linhas**: 162, 177

As queries estavam filtrando por `WHERE ativo = true`, mas as tabelas `clientes` e `produtos` **não possuem essa coluna**.

### Erro 2: Coluna "total_registros" não existe  
**Arquivo**: `backend/routes/dashboard.js`
**Linha**: 172

A query buscava `WHERE total_registros > 1`, mas a coluna correta é `total_filiais`.

**IMPACTO**: Este erro SQL estava causando falha no endpoint `/api/dashboard/stats`, fazendo **TODOS os cards ficarem zerados** (efeito cascata).

### Erro 3: Tabela kpis_consolidados vazia
**Arquivo**: `backend/routes/dashboard.js`
**Linhas**: 11-93

O endpoint `/api/dashboard/kpis` buscava dados da tabela `kpis_consolidados` no DB Analítico, que está **vazia** (não há processo de consolidação automático).

---

## ✅ Correções Aplicadas

### Correção 1: Remover filtro "ativo" de clientes
**Antes**:
```javascript
const clientesResult = await poolTransacional.query(
  'SELECT COUNT(*) as total FROM clientes WHERE ativo = true'
);
```

**Depois**:
```javascript
const clientesResult = await poolTransacional.query(
  'SELECT COUNT(*) as total FROM clientes'
);
```

**Resultado Esperado**: Card mostrará **16.402 clientes**

---

### Correção 2: Remover filtro "ativo" de produtos
**Antes**:
```javascript
const produtosResult = await poolTransacional.query(
  'SELECT COUNT(*) as total FROM produtos WHERE ativo = true'
);
```

**Depois**:
```javascript
const produtosResult = await poolTransacional.query(
  'SELECT COUNT(*) as total FROM produtos'
);
```

---

### Correção 3: Corrigir nome da coluna (total_registros → total_filiais)
**Antes**:
```javascript
const multiplasResult = await poolAnalitico.query(
  'SELECT COUNT(*) as total FROM clientes_unificados WHERE total_registros > 1'
);
```

**Depois**:
```javascript
const multiplasResult = await poolAnalitico.query(
  'SELECT COUNT(*) as total FROM clientes_unificados WHERE total_filiais > 1'
);
```

**CRÍTICO**: Esta era a causa principal! O erro SQL travava todo o endpoint.

---

### Correção 4: Calcular KPIs em tempo real
**Antes**: Buscava de `kpis_consolidados` (tabela vazia)

**Depois**: Calcula em tempo real da tabela `pedidos`:
```javascript
let kpisQuery = `
  SELECT 
    COUNT(DISTINCT p.cliente_id) as total_clientes,
    COALESCE(SUM(p.valor_total), 0) as receita_total,
    COUNT(p.id) as total_pedidos,
    COALESCE(AVG(p.valor_total), 0) as ticket_medio
  FROM pedidos p
  WHERE EXTRACT(YEAR FROM p.data_pedido) = $1
    AND EXTRACT(MONTH FROM p.data_pedido) = $2
`;
```

**Resultado Esperado**: 
- Receita Total: **R$ 631.7K** (fevereiro 2026)
- 536 pedidos no mês

---

## 📊 Valores Esperados Após Deploy

| Card | Antes | Depois | Fonte |
|------|-------|--------|-------|
| **Total de Clientes** | 0 | **16.402** | DB Transacional |
| **Receita Total** | R$ 0.0K | **R$ 631.7K** | Calculado de pedidos (fev/2026) |
| **Margem Líquida** | 0.0% | **0.0%** | Esperado (sem dados de custo) |
| **Integrações Ativas** | 0 | **7** | DB Gestão |

---

## 🚀 Instruções de Deploy

### 1. Fazer commit das alterações
```bash
cd /home/ubuntu/oracullo_LuizGouveia
git add backend/routes/dashboard.js
git commit -m "fix: corrigir queries do dashboard que causavam cards zerados

- Remover filtro WHERE ativo=true (coluna não existe)
- Corrigir total_registros para total_filiais
- Implementar cálculo de KPIs em tempo real"
git push origin main
```

### 2. Deploy na VPS
```bash
# Conectar na VPS
ssh root@srv1011496

# Ir para o diretório do projeto
cd ~/projects/oracullo_LuizGouveia

# Fazer backup
cp backend/routes/dashboard.js backend/routes/dashboard.js.backup

# Puxar alterações
git pull origin main

# Verificar se arquivo foi atualizado
grep "total_filiais" backend/routes/dashboard.js
# Deve retornar a linha com a correção

# Reiniciar backend (ajustar comando conforme seu setup)
pm2 restart oracullo-backend
# OU
systemctl restart oracullo-backend
# OU se estiver rodando com npm:
cd backend
npm run dev
```

### 3. Testar endpoints
```bash
# Testar endpoint de stats
curl http://localhost:3000/api/dashboard/stats

# Deve retornar algo como:
# {
#   "total_clientes": 16402,
#   "total_clientes_unificados": 13669,
#   "clientes_multiplas_filiais": XXX,
#   "total_produtos": XXX,
#   "total_integracoes": 7,
#   "integracoes_ativas": 7,
#   "ultima_sincronizacao": "..."
# }

# Testar endpoint de KPIs
curl http://localhost:3000/api/dashboard/kpis

# Deve retornar algo como:
# {
#   "periodo": "2026-02",
#   "receita_total": 631682.75,
#   "total_pedidos": 536,
#   "ticket_medio": 1178.51,
#   ...
# }
```

### 4. Validar no frontend
1. Abrir o dashboard no navegador
2. Fazer hard refresh (Ctrl+Shift+R)
3. Verificar se os 4 cards mostram valores corretos

---

## 🔧 Troubleshooting

### Se os cards continuarem zerados:

1. **Verificar logs do backend**:
```bash
pm2 logs oracullo-backend --lines 100
# OU
journalctl -u oracullo-backend -n 100
```

2. **Verificar se há erros SQL**:
Procurar por mensagens de erro relacionadas a queries.

3. **Testar conexão com bancos**:
```bash
cd ~/projects/oracullo_LuizGouveia/backend
node -e "import('./config/databases.js').then(m => m.testConnections())"
```

4. **Verificar variáveis de ambiente**:
```bash
cat .env
# Verificar se DB_HOST, DB_USER, DB_PASSWORD estão corretos
```

5. **Reiniciar PostgreSQL** (se necessário):
```bash
sudo systemctl restart postgresql
```

---

## 📝 Notas Importantes

### Margem Líquida
O card "Margem Líquida" continuará mostrando **0.0%** porque:
- Requer dados de **custo** dos produtos
- Campo `custo` pode não estar preenchido na tabela `produtos`
- Cálculo de margem requer: `(receita - custo) / receita * 100`

**Para implementar no futuro**:
1. Garantir que sincronização da OMIE preenche campo `custo`
2. Atualizar query de KPIs para calcular margem

### Performance
O cálculo de KPIs em tempo real pode ser lento com muitos dados. Para melhorar:
1. Criar índices nas colunas `data_pedido` e `integracao_id`
2. Implementar cache (Redis)
3. Ou implementar processo de consolidação no DB Analítico

---

## ✅ Checklist de Validação

- [ ] Código commitado no GitHub
- [ ] Pull executado na VPS
- [ ] Backend reiniciado
- [ ] Endpoint `/api/dashboard/stats` retorna valores corretos
- [ ] Endpoint `/api/dashboard/kpis` retorna valores corretos
- [ ] Card "Total de Clientes" mostra 16.402
- [ ] Card "Receita Total" mostra R$ 631.7K
- [ ] Card "Integrações Ativas" mostra 7
- [ ] Card "Margem Líquida" mostra 0.0% (esperado)
- [ ] Logs do backend sem erros SQL

---

## 📞 Suporte

Se após seguir todos os passos os cards continuarem zerados, forneça:
1. Logs completos do backend
2. Resultado dos comandos `curl` dos endpoints
3. Screenshot do console do navegador (F12 → Network)
