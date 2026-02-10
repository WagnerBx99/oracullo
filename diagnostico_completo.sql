-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO COMPLETO - Dashboard Oracullo
-- ═══════════════════════════════════════════════════════════════════════════
-- Este script deve ser executado NA VPS para diagnosticar por que os cards
-- estão zerados. Execute cada seção e anote os resultados.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- BANCO 1: oracullo_gestao
-- ═══════════════════════════════════════════════════════════════════════════

\c oracullo_gestao

\echo '═══════════════════════════════════════════════════════════════════════════'
\echo 'DIAGNÓSTICO: DB GESTÃO (oracullo_gestao)'
\echo '═══════════════════════════════════════════════════════════════════════════'

\echo ''
\echo '1. INTEGRAÇÕES - Listagem Completa'
\echo '-----------------------------------'
SELECT 
    id,
    nome,
    tipo,
    sistema,
    status,
    ultima_sincronizacao,
    created_at
FROM integracoes
ORDER BY id;

\echo ''
\echo '2. INTEGRAÇÕES - Resumo por Status'
\echo '-----------------------------------'
SELECT 
    status,
    COUNT(*) as quantidade
FROM integracoes
GROUP BY status
ORDER BY quantidade DESC;

\echo ''
\echo '3. INTEGRAÇÕES - Total e Ativas'
\echo '-----------------------------------'
SELECT 
    COUNT(*) as total_integracoes,
    COUNT(*) FILTER (WHERE status = 'conectado') as integracoes_ativas,
    COUNT(*) FILTER (WHERE status = 'pendente') as integracoes_pendentes,
    COUNT(*) FILTER (WHERE status = 'erro') as integracoes_com_erro
FROM integracoes;

\echo ''
\echo '4. LOGS DE SINCRONIZAÇÃO - Últimos 10'
\echo '-----------------------------------'
SELECT 
    ls.id,
    i.nome as integracao,
    ls.tipo,
    ls.status,
    ls.total_registros,
    ls.mensagem,
    ls.created_at
FROM logs_sincronizacao ls
INNER JOIN integracoes i ON ls.integracao_id = i.id
ORDER BY ls.created_at DESC
LIMIT 10;

\echo ''
\echo '5. USUÁRIOS - Total'
\echo '-----------------------------------'
SELECT COUNT(*) as total_usuarios FROM usuarios;

-- ═══════════════════════════════════════════════════════════════════════════
-- BANCO 2: oracullo_transacional
-- ═══════════════════════════════════════════════════════════════════════════

\c oracullo_transacional

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════════'
\echo 'DIAGNÓSTICO: DB TRANSACIONAL (oracullo_transacional)'
\echo '═══════════════════════════════════════════════════════════════════════════'

\echo ''
\echo '6. CLIENTES - Total Geral'
\echo '-----------------------------------'
SELECT COUNT(*) as total_clientes FROM clientes;

\echo ''
\echo '7. CLIENTES - Por Integração'
\echo '-----------------------------------'
SELECT 
    integracao_id,
    COUNT(*) as quantidade_clientes
FROM clientes
GROUP BY integracao_id
ORDER BY integracao_id;

\echo ''
\echo '8. CLIENTES - Verificar se existe coluna "ativo"'
\echo '-----------------------------------'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clientes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo '9. PRODUTOS - Total Geral'
\echo '-----------------------------------'
SELECT COUNT(*) as total_produtos FROM produtos;

\echo ''
\echo '10. PRODUTOS - Por Integração'
\echo '-----------------------------------'
SELECT 
    integracao_id,
    COUNT(*) as quantidade_produtos
FROM produtos
GROUP BY integracao_id
ORDER BY integracao_id;

\echo ''
\echo '11. PRODUTOS - Verificar se existe coluna "ativo"'
\echo '-----------------------------------'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'produtos' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo '12. PRODUTOS - Com custo preenchido'
\echo '-----------------------------------'
SELECT 
    COUNT(*) as total_produtos,
    COUNT(*) FILTER (WHERE custo IS NOT NULL) as com_custo,
    COUNT(*) FILTER (WHERE custo IS NOT NULL AND custo > 0) as com_custo_maior_zero
FROM produtos;

\echo ''
\echo '13. PEDIDOS - Total Geral'
\echo '-----------------------------------'
SELECT COUNT(*) as total_pedidos FROM pedidos;

\echo ''
\echo '14. PEDIDOS - Por Integração'
\echo '-----------------------------------'
SELECT 
    integracao_id,
    COUNT(*) as quantidade_pedidos,
    SUM(valor_total) as valor_total_pedidos
FROM pedidos
GROUP BY integracao_id
ORDER BY integracao_id;

\echo ''
\echo '15. PEDIDOS - Distribuição por Ano/Mês'
\echo '-----------------------------------'
SELECT 
    EXTRACT(YEAR FROM data_pedido) as ano,
    EXTRACT(MONTH FROM data_pedido) as mes,
    COUNT(*) as quantidade_pedidos,
    SUM(valor_total) as valor_total
FROM pedidos
WHERE data_pedido IS NOT NULL
GROUP BY EXTRACT(YEAR FROM data_pedido), EXTRACT(MONTH FROM data_pedido)
ORDER BY ano DESC, mes DESC
LIMIT 12;

\echo ''
\echo '16. PEDIDOS - Mês Atual (Fevereiro 2026)'
\echo '-----------------------------------'
SELECT 
    COUNT(*) as total_pedidos,
    COUNT(DISTINCT cliente_id) as clientes_unicos,
    SUM(valor_total) as receita_total,
    AVG(valor_total) as ticket_medio
FROM pedidos
WHERE EXTRACT(YEAR FROM data_pedido) = 2026
  AND EXTRACT(MONTH FROM data_pedido) = 2;

\echo ''
\echo '17. PEDIDOS - Verificar estrutura da tabela'
\echo '-----------------------------------'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo '18. PEDIDOS - Amostra de 5 registros'
\echo '-----------------------------------'
SELECT 
    id,
    integracao_id,
    numero_pedido,
    data_pedido,
    valor_total,
    status
FROM pedidos
ORDER BY data_pedido DESC
LIMIT 5;

\echo ''
\echo '19. PEDIDO_ITENS - Total'
\echo '-----------------------------------'
SELECT COUNT(*) as total_itens FROM pedido_itens;

-- ═══════════════════════════════════════════════════════════════════════════
-- BANCO 3: oracullo_analitico
-- ═══════════════════════════════════════════════════════════════════════════

\c oracullo_analitico

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════════'
\echo 'DIAGNÓSTICO: DB ANALÍTICO (oracullo_analitico)'
\echo '═══════════════════════════════════════════════════════════════════════════'

\echo ''
\echo '20. CLIENTES UNIFICADOS - Total'
\echo '-----------------------------------'
SELECT COUNT(*) as total_clientes_unificados FROM clientes_unificados;

\echo ''
\echo '21. CLIENTES UNIFICADOS - Com múltiplas filiais'
\echo '-----------------------------------'
SELECT COUNT(*) as clientes_multiplas_filiais 
FROM clientes_unificados 
WHERE total_filiais > 1;

\echo ''
\echo '22. KPIs CONSOLIDADOS - Total de registros'
\echo '-----------------------------------'
SELECT COUNT(*) as total_registros FROM kpis_consolidados;

\echo ''
\echo '23. KPIs CONSOLIDADOS - Últimos registros'
\echo '-----------------------------------'
SELECT 
    data_referencia,
    integracao_id,
    faturamento_total,
    total_vendas,
    ticket_medio
FROM kpis_consolidados
ORDER BY data_referencia DESC
LIMIT 10;

\echo ''
\echo '24. VENDAS CONSOLIDADAS - Total de registros'
\echo '-----------------------------------'
SELECT COUNT(*) as total_registros FROM vendas_consolidadas;

\echo ''
\echo '25. VENDAS POR PERÍODO - Se existir'
\echo '-----------------------------------'
SELECT COUNT(*) as total_registros 
FROM information_schema.tables 
WHERE table_name = 'vendas_por_periodo' 
  AND table_schema = 'public';

-- ═══════════════════════════════════════════════════════════════════════════
-- RESUMO FINAL
-- ═══════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════════'
\echo 'RESUMO FINAL - O QUE OS CARDS DEVERIAM MOSTRAR'
\echo '═══════════════════════════════════════════════════════════════════════════'

\c oracullo_transacional
\echo ''
\echo 'CARD 1 - Total de Clientes:'
SELECT COUNT(*) as valor_esperado FROM clientes;

\c oracullo_gestao
\echo ''
\echo 'CARD 4 - Integrações Ativas:'
SELECT 
    COUNT(*) FILTER (WHERE status = 'conectado') as valor_esperado,
    COUNT(*) as total_integracoes
FROM integracoes;

\c oracullo_transacional
\echo ''
\echo 'CARD 2 - Receita Total (Fevereiro 2026):'
SELECT 
    COALESCE(SUM(valor_total), 0) as valor_esperado,
    COUNT(*) as pedidos_no_mes
FROM pedidos
WHERE EXTRACT(YEAR FROM data_pedido) = 2026
  AND EXTRACT(MONTH FROM data_pedido) = 2;

\echo ''
\echo 'CARD 3 - Margem Líquida:'
\echo 'Requer cálculo com dados de custo dos produtos (não implementado)'

\echo ''
\echo '═══════════════════════════════════════════════════════════════════════════'
\echo 'FIM DO DIAGNÓSTICO'
\echo '═══════════════════════════════════════════════════════════════════════════'
\echo ''
\echo 'INSTRUÇÕES:'
\echo '1. Copie TODA a saída deste script'
\echo '2. Envie para análise'
\echo '3. Com base nos resultados, identificaremos exatamente o problema'
\echo ''
