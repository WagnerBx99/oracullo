-- Script para popular dados de exemplo rastreáveis
-- Todos os dados inseridos por este script são registrados na tabela dados_exemplo

-- Conectar ao DB Analítico para inserir dados de exemplo

-- Função auxiliar para registrar dados de exemplo
CREATE OR REPLACE FUNCTION registrar_dado_exemplo(
    p_tabela VARCHAR,
    p_descricao TEXT,
    p_quantidade INT DEFAULT 1
) RETURNS VOID AS $$
BEGIN
    INSERT INTO dados_exemplo (tabela, descricao, quantidade, created_at)
    VALUES (p_tabela, p_descricao, p_quantidade, CURRENT_TIMESTAMP);
END;
$$ LANGUAGE plpgsql;

-- Limpar dados de exemplo anteriores
TRUNCATE TABLE kpis_consolidados CASCADE;
TRUNCATE TABLE vendas_consolidadas CASCADE;
TRUNCATE TABLE dados_exemplo CASCADE;

-- ========================================
-- DADOS DE EXEMPLO: KPIs Consolidados
-- ========================================

-- Inserir KPIs de exemplo para Dashboard Diretoria
INSERT INTO kpis_consolidados (
    periodo_tipo,
    periodo_inicio,
    periodo_fim,
    faturamento_total,
    margem_operacional,
    roi_geral,
    crescimento,
    total_vendas,
    ticket_medio,
    taxa_conversao,
    nps,
    eficiencia_geral,
    prazo_medio_entrega,
    taxa_entrega,
    nao_conformidades,
    created_at,
    updated_at
) VALUES
-- Dados do mês atual (fevereiro 2026)
(
    'mensal',
    '2026-02-01'::DATE,
    '2026-02-28'::DATE,
    3200000.00,  -- R$ 3,2M de faturamento
    38.5,        -- 38.5% margem operacional
    24.8,        -- 24.8% ROI
    15.2,        -- 15.2% crescimento
    220,         -- 220 vendas
    2050.00,     -- R$ 2.050 ticket médio
    30.0,        -- 30% taxa de conversão
    85,          -- NPS 85
    98.8,        -- 98.8% eficiência
    3.2,         -- 3.2 dias prazo médio
    96.5,        -- 96.5% taxa de entrega
    0.4,         -- 0.4% não conformidades
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Dados do mês anterior (janeiro 2026)
(
    'mensal',
    '2026-01-01'::DATE,
    '2026-01-31'::DATE,
    2800000.00,
    36.2,
    22.5,
    12.8,
    195,
    1950.00,
    28.5,
    82,
    97.5,
    3.5,
    95.2,
    0.6,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Dados anuais (2025)
(
    'anual',
    '2025-01-01'::DATE,
    '2025-12-31'::DATE,
    32500000.00,
    35.8,
    21.2,
    18.5,
    2340,
    1880.00,
    27.8,
    80,
    96.8,
    3.8,
    94.5,
    0.8,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Registrar dados de exemplo
SELECT registrar_dado_exemplo(
    'kpis_consolidados',
    'KPIs consolidados para dashboards (3 períodos: fev/2026, jan/2026, ano 2025)',
    3
);

-- ========================================
-- DADOS DE EXEMPLO: Vendas Consolidadas
-- ========================================

-- Inserir vendas consolidadas por filial e período
DO $$
DECLARE
    v_filial_id INT;
    v_filial_nome VARCHAR;
    v_mes INT;
    v_ano INT := 2025;
    v_vendas_base DECIMAL;
    v_receita_base DECIMAL;
BEGIN
    -- Para cada filial OMIE
    FOR v_filial_id, v_filial_nome IN 
        SELECT id, nome 
        FROM dblink(
            'host=localhost dbname=oracullo_gestao user=oracullo_user password=oracullo123',
            'SELECT id, nome FROM integracoes WHERE sistema = ''omie'' ORDER BY id'
        ) AS t(id INT, nome VARCHAR)
    LOOP
        -- Para cada mês de 2025
        FOR v_mes IN 1..12 LOOP
            -- Calcular valores base (variando por filial e mês)
            v_vendas_base := 15 + (v_filial_id * 2) + (v_mes * 0.5);
            v_receita_base := 80000 + (v_filial_id * 5000) + (v_mes * 2000);
            
            INSERT INTO vendas_consolidadas (
                integracao_id,
                filial_nome,
                periodo_tipo,
                periodo_inicio,
                periodo_fim,
                total_vendas,
                receita_total,
                ticket_medio,
                margem_media,
                produtos_vendidos,
                created_at,
                updated_at
            ) VALUES (
                v_filial_id,
                v_filial_nome,
                'mensal',
                make_date(v_ano, v_mes, 1),
                (make_date(v_ano, v_mes, 1) + INTERVAL '1 month - 1 day')::DATE,
                v_vendas_base::INT,
                v_receita_base,
                (v_receita_base / v_vendas_base),
                35.0 + (v_mes * 0.5),  -- Margem variando de 35.5% a 41%
                (v_vendas_base * 3.2)::INT,  -- ~3 produtos por venda
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
    END LOOP;
END $$;

-- Registrar dados de exemplo
SELECT registrar_dado_exemplo(
    'vendas_consolidadas',
    'Vendas consolidadas por filial OMIE para 2025 (8 filiais x 12 meses = 96 registros)',
    96
);

-- ========================================
-- DADOS DE EXEMPLO: Produtos (para Gestão de Preços)
-- ========================================

-- Inserir produtos de exemplo no DB Transacional
DO $$
DECLARE
    v_integracao_id INT;
    v_produto_count INT := 0;
BEGIN
    -- Pegar primeira integração OMIE
    SELECT id INTO v_integracao_id
    FROM dblink(
        'host=localhost dbname=oracullo_gestao user=oracullo_user password=oracullo123',
        'SELECT id FROM integracoes WHERE sistema = ''omie'' ORDER BY id LIMIT 1'
    ) AS t(id INT);

    -- Inserir 50 produtos de exemplo
    FOR i IN 1..50 LOOP
        PERFORM * FROM dblink(
            'host=localhost dbname=oracullo_transacional user=oracullo_user password=oracullo123',
            format('
                INSERT INTO produtos (
                    integracao_id,
                    external_id,
                    codigo,
                    nome,
                    descricao,
                    preco,
                    custo,
                    margem,
                    estoque,
                    unidade,
                    categoria,
                    ativo,
                    data_json,
                    created_at,
                    updated_at
                ) VALUES (
                    %s,
                    ''PROD_%s'',
                    ''SKU%s'',
                    ''Produto Exemplo %s'',
                    ''Descrição do produto exemplo %s para demonstração'',
                    %s,
                    %s,
                    %s,
                    %s,
                    ''UN'',
                    ''Categoria %s'',
                    true,
                    ''{}''::jsonb,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )
            ',
            v_integracao_id,
            i::TEXT,
            LPAD(i::TEXT, 5, '0'),
            i::TEXT,
            i::TEXT,
            (50 + (i * 10))::TEXT,  -- Preço de R$ 60 a R$ 550
            (30 + (i * 6))::TEXT,   -- Custo de R$ 36 a R$ 330
            ((1 - (30 + i * 6)::DECIMAL / (50 + i * 10)::DECIMAL) * 100)::TEXT,  -- Margem calculada
            (100 + (i * 5))::TEXT,  -- Estoque de 105 a 350
            ((i - 1) / 10 + 1)::TEXT  -- 5 categorias
            )
        ) AS t(result TEXT);
        
        v_produto_count := v_produto_count + 1;
    END LOOP;
END $$;

-- Registrar dados de exemplo
SELECT registrar_dado_exemplo(
    'produtos',
    'Produtos de exemplo para gestão de preços (50 produtos)',
    50
);

-- ========================================
-- RESUMO DOS DADOS DE EXEMPLO
-- ========================================

SELECT 
    tabela,
    descricao,
    quantidade,
    created_at
FROM dados_exemplo
ORDER BY created_at;

-- Mensagem final
DO $$
BEGIN
    RAISE NOTICE '✅ Dados de exemplo populados com sucesso!';
    RAISE NOTICE '📊 Total de registros: %', (SELECT SUM(quantidade) FROM dados_exemplo);
    RAISE NOTICE '📝 Consulte a tabela dados_exemplo para rastreamento';
END $$;
