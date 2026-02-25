import { calculateSalesRow } from './calculateSalesRow.js';

// Ordem fixa exigida pelo relatório
export const FIXED_BRANDS = [
    'MANNOL',
    'Mannol Motor',
    'Mannol Transmissão',
    'Mannol Especialidade',
    'Mannol Aditivo',
    'Mannol Arrefecimento',
    'PECMOTORS',
    'RAVENOL',
    'LUBEGARD',
    'THE EAGLE FILTROS',
    'THE EAGLE PEÇAS E FERRAMENTAS',
    'ATF 6000 ADAPTADORES',
    'OUTROS'
];

/**
 * Retorna o nome da marca na "bucket" oficial com base no brand e subgroup originais.
 */
function mapBrand(originalBrand, originalSubgroup) {
    const brandStr = (originalBrand || '').trim().toUpperCase();
    const subgroupStr = (originalSubgroup || '').trim().toUpperCase();

    if (subgroupStr.includes('MANNOL MOTOR')) return 'Mannol Motor';
    if (subgroupStr.includes('MANNOL TRANSMISSÃO') || subgroupStr.includes('MANNOL TRANSMISSAO')) return 'Mannol Transmissão';
    if (subgroupStr.includes('MANNOL ESPECIALIDADE')) return 'Mannol Especialidade';
    if (subgroupStr.includes('MANNOL ADITIVO') || subgroupStr.includes('MANNOL ADITIVOS')) return 'Mannol Aditivo';
    if (subgroupStr.includes('MANNOL ARREFECIMENTO')) return 'Mannol Arrefecimento';

    // Fallback: Se a brand é algo derivado de Mannol mas não achou um subgroup específico, cai em OUTROS
    // (a soma de MANNOL pai será calculada DEPOIS, baseada nestes 5 subgrupos).

    if (brandStr === 'LUBEGARD') return 'LUBEGARD';
    if (brandStr === 'PECMOTORS') return 'PECMOTORS';
    if (brandStr === 'RAVENOL') return 'RAVENOL';
    if (brandStr === 'THE EAGLE FILTROS') return 'THE EAGLE FILTROS';
    if (brandStr === 'THE EAGLE PEÇAS E FERRAMENTAS') return 'THE EAGLE PEÇAS E FERRAMENTAS';
    if (brandStr === 'ATF 6000 ADAPTADORES') return 'ATF 6000 ADAPTADORES';

    return 'OUTROS';
}

function createEmptyBrandObj(brandName) {
    return {
        brand: brandName,
        rank: 0,
        revenue: 0,
        cost: 0,
        liters_qty: 0,
        avg_ticket: 0,
        gross_margin: 0,
        operational_cost_pct: 0,
        operational_cost_rs: 0,
        net_margin_pct: 0,
        net_profitability: 0,
        salesperson_comm_pct: 0,
        salesperson_comm_rs: 0,
        internal_comm_pct: 0,
        internal_comm_rs: 0
    };
}

/**
 * Agrupa linhas processadas em buckets de marca e gera os totais.
 * Assumimos que `rows` já são os objetos retornados por `calculateSalesRow`.
 * 
 * @param {Array} rows - transações (já enriquecidas com calculateSalesRow)
 * @param {boolean} isConsolidated - true se for calcular a comissão gerente
 * @param {Object} brandConfigsMap - mapa config marcas (para buscar a comissão gerente)
 */
export function groupByBrand(rows, isConsolidated = false, brandConfigsMap = {}) {
    let totalRevenue = 0;

    // Inicializa o dicionário com todas as marcas fixas zeradas
    const brandMap = {};
    for (const b of FIXED_BRANDS) {
        brandMap[b] = createEmptyBrandObj(b);
    }

    // Acumula os valores
    for (const row of rows) {
        let bucket = mapBrand(row.brand, row.subgroup);

        // Se a string "MANNOL" pura veio e não pegou subgroup, vamos jogar no OUTROS ou apenas somar lá.
        // O PRD diz: A linha MANNOL (pai) é a soma dos subgrupos. (portanto, transações avulsas não caem direto nela aqui).
        if (bucket === 'MANNOL') bucket = 'OUTROS';

        const bData = brandMap[bucket];
        if (!bData) continue; // safety

        bData.revenue += Number(row.total_sale || 0);
        bData.cost += Number(row.total_cost || 0);
        bData.liters_qty += Number(row.liters_qty || 0);
        bData.operational_cost_rs += Number(row.operational_cost_rs || 0);
        bData.net_profitability += Number(row.net_profitability || 0);
        bData.salesperson_comm_rs += Number(row.salesperson_comm_rs || 0);
        bData.internal_comm_rs += Number(row.internal_comm_rs || 0);

        totalRevenue += Number(row.total_sale || 0);
    }

    // Calcula a linha "Pai" MANNOL
    const mannolSubgroups = [
        'Mannol Motor', 'Mannol Transmissão', 'Mannol Especialidade',
        'Mannol Aditivo', 'Mannol Arrefecimento'
    ];
    for (const sub of mannolSubgroups) {
        const subData = brandMap[sub];
        const paiData = brandMap['MANNOL'];

        paiData.revenue += subData.revenue;
        paiData.cost += subData.cost;
        paiData.liters_qty += subData.liters_qty;
        paiData.operational_cost_rs += subData.operational_cost_rs;
        paiData.net_profitability += subData.net_profitability;
        paiData.salesperson_comm_rs += subData.salesperson_comm_rs;
        paiData.internal_comm_rs += subData.internal_comm_rs;
    }

    // 1) Descobre o Verdadeiro Faturamento Total da Bucket para o cálculo de Rank correto
    // Devemos somar tudo, EXCETO a linha "MANNOL" (pai) visto que ela é uma aglomeração de suas filhas e não uma linha de faturamento avulsa (evitando duplicar $ no Total).
    let realTotalRevenue = 0;
    for (const b of FIXED_BRANDS) {
        if (b !== 'MANNOL') {
            realTotalRevenue += brandMap[b].revenue;
        }
    }

    // Formata médias e percentuais
    for (const b of FIXED_BRANDS) {
        const bData = brandMap[b];

        // Evita divisão por zero
        bData.avg_ticket = bData.liters_qty > 0 ? (bData.revenue / bData.liters_qty) : 0;
        bData.gross_margin = bData.revenue > 0 ? ((bData.revenue - bData.cost) / bData.revenue) : 0;
        bData.operational_cost_pct = bData.revenue > 0 ? (bData.operational_cost_rs / bData.revenue) : 0;
        bData.net_margin_pct = bData.gross_margin - bData.operational_cost_pct;
        bData.salesperson_comm_pct = bData.revenue > 0 ? (bData.salesperson_comm_rs / bData.revenue) : 0;
        bData.internal_comm_pct = bData.revenue > 0 ? (bData.internal_comm_rs / bData.revenue) : 0;

        // Correção do Rank da marca: Faturamento da Marca / Faturamento Total Verdadeiro
        bData.rank = realTotalRevenue > 0 ? (bData.revenue / realTotalRevenue) : 0;

        // Limpa erros de float
        bData.revenue = Number(bData.revenue.toFixed(2));
        bData.cost = Number(bData.cost.toFixed(2));
        bData.avg_ticket = Number(bData.avg_ticket.toFixed(2));
        bData.operational_cost_rs = Number(bData.operational_cost_rs.toFixed(2));
        bData.net_profitability = Number(bData.net_profitability.toFixed(2));
        bData.salesperson_comm_rs = Number(bData.salesperson_comm_rs.toFixed(2));
        bData.internal_comm_rs = Number(bData.internal_comm_rs.toFixed(2));

        if (isConsolidated) {
            // manager_comm_pct é puxado de brand_configs para essa marca especifica (ou pega fallback)
            // Cuidado: brand_configs[bucket] pode ter um nome original q a gente não mapeou perfeito no banco
            // Como Mannol Pai é uma agregação e nao ta clara na BD, vou usar o default 0.01 se nao achar
            let conf = null;
            if (brandConfigsMap) {
                // Tenta achar pelo nome exato atual (ex. "Mannol Motor") ou upperCase
                const searchKey = b.toUpperCase().trim();
                for (let k in brandConfigsMap) {
                    if (k.toUpperCase().trim() === searchKey || k.toUpperCase().includes(searchKey) || searchKey.includes(k.toUpperCase().trim())) {
                        conf = brandConfigsMap[k];
                        break;
                    }
                }
            }

            bData.manager_comm_pct = conf && conf.manager_comm_pct ? Number(conf.manager_comm_pct) : 0.01;
            bData.manager_comm_rs = Number((bData.revenue * bData.manager_comm_pct).toFixed(2));
        }
    }

    // Linha de TOTAL 
    // OBS: O TOTAL da tabela não soma "MANNOL" pai, senão duplica os filhos de MANNOL !
    // Entao somamos todas as marcas fixas EXCETO "MANNOL" (pai).
    const TOTAL = createEmptyBrandObj('TOTAL');
    TOTAL.rank = 1; // Rank do total é sempre 100% (1.00)
    for (const b of FIXED_BRANDS) {
        if (b === 'MANNOL') continue;
        const bData = brandMap[b];
        TOTAL.revenue += bData.revenue;
        TOTAL.cost += bData.cost;
        TOTAL.liters_qty += bData.liters_qty;
        TOTAL.operational_cost_rs += bData.operational_cost_rs;
        TOTAL.net_profitability += bData.net_profitability;
        TOTAL.salesperson_comm_rs += bData.salesperson_comm_rs;
        TOTAL.internal_comm_rs += bData.internal_comm_rs;
    }

    TOTAL.avg_ticket = TOTAL.liters_qty > 0 ? (TOTAL.revenue / TOTAL.liters_qty) : 0;
    TOTAL.gross_margin = TOTAL.revenue > 0 ? ((TOTAL.revenue - TOTAL.cost) / TOTAL.revenue) : 0;
    TOTAL.operational_cost_pct = TOTAL.revenue > 0 ? (TOTAL.operational_cost_rs / TOTAL.revenue) : 0;
    TOTAL.net_margin_pct = TOTAL.gross_margin - TOTAL.operational_cost_pct;
    TOTAL.salesperson_comm_pct = TOTAL.revenue > 0 ? (TOTAL.salesperson_comm_rs / TOTAL.revenue) : 0;
    TOTAL.internal_comm_pct = TOTAL.revenue > 0 ? (TOTAL.internal_comm_rs / TOTAL.revenue) : 0;

    TOTAL.revenue = Number(TOTAL.revenue.toFixed(2));
    TOTAL.cost = Number(TOTAL.cost.toFixed(2));
    TOTAL.avg_ticket = Number(TOTAL.avg_ticket.toFixed(2));
    TOTAL.operational_cost_rs = Number(TOTAL.operational_cost_rs.toFixed(2));
    TOTAL.net_profitability = Number(TOTAL.net_profitability.toFixed(2));
    TOTAL.salesperson_comm_rs = Number(TOTAL.salesperson_comm_rs.toFixed(2));
    TOTAL.internal_comm_rs = Number(TOTAL.internal_comm_rs.toFixed(2));

    if (isConsolidated) {
        // manager_comm_rs do TOTAL soma o manager_comm_rs de todas EXCETO MANNOL (q duplica)
        TOTAL.manager_comm_rs = 0;
        for (const b of FIXED_BRANDS) {
            if (b === 'MANNOL') continue;
            TOTAL.manager_comm_rs += brandMap[b].manager_comm_rs || 0;
        }
        TOTAL.manager_comm_pct = TOTAL.revenue > 0 ? (TOTAL.manager_comm_rs / TOTAL.revenue) : 0;

        TOTAL.manager_comm_rs = Number(TOTAL.manager_comm_rs.toFixed(2));
    }

    return FIXED_BRANDS.map(b => brandMap[b]).concat([TOTAL]);
}
