import { groupByBrand } from './consolidated-report.aggregator.js';

export class ConsolidatedReportService {
    /**
     * Monta a visão consolidada a partir dos dados processados puros
     * @param {Array} transactionsData Array de transações já passadas pelo calculateSalesRow
     * @param {Object} brandConfigsMap Configurações das marcas direto do banco
     * @returns {Object} { by_salesperson, by_branch, consolidated }
     */
    buildConsolidatedView(transactionsData, brandConfigsMap) {
        // Agrupar transações por Vendedor
        const salespersonsMap = {};
        // Agrupar transações por Filial
        const branchesMap = {};

        for (const t of transactionsData) {
            // Se omitido na transação original, trata como 'Não Informado'
            const sp = t.salesperson || 'Não Informado';
            const br = t.branch || 'Não Informada';

            if (!salespersonsMap[sp]) salespersonsMap[sp] = [];
            salespersonsMap[sp].push(t);

            if (!branchesMap[br]) branchesMap[br] = [];
            branchesMap[br].push(t);
        }

        const by_salesperson = [];
        for (const sp in salespersonsMap) {
            const rows = salespersonsMap[sp];
            const aggregated = groupByBrand(rows, false, {}); // Vendedor não exibe com. gerente

            // Oculta Vendedor cujo faturamento total é "0" (linha 13 do retorno de groupByBrand costuma ser o TOTAL rank=null)
            const totalRow = aggregated.find(a => a.brand === 'TOTAL');
            if (totalRow && totalRow.revenue > 0) {
                by_salesperson.push({
                    salesperson: sp,
                    brands: aggregated
                });
            }
        }

        const by_branch = [];
        for (const br in branchesMap) {
            const rows = branchesMap[br];
            const aggregated = groupByBrand(rows, false, {}); // Filial também não

            const totalRow = aggregated.find(a => a.brand === 'TOTAL');
            if (totalRow && totalRow.revenue > 0) {
                by_branch.push({
                    branch: br,
                    brands: aggregated
                });
            }
        }

        // Ordenacao alfabética
        by_salesperson.sort((a, b) => a.salesperson.localeCompare(b.salesperson));
        by_branch.sort((a, b) => a.branch.localeCompare(b.branch));

        // Consolidado Geral daquele mês/estado (tudo junto com param isConsolidated=true)
        // Usa brandConfigsMap do banco original para preencher manager_comm_pct
        const consolidatedBrands = groupByBrand(transactionsData, true, brandConfigsMap);
        const consolidated = {
            brands: consolidatedBrands
        };

        return {
            by_salesperson,
            by_branch,
            consolidated
        };
    }
}

export default new ConsolidatedReportService();
