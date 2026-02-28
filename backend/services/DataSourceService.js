import { poolAnalitico } from '../config/databases.js';

/**
 * Serviço de Fonte de Dados Abstrata.
 */
export class DataSourceService {
    /**
     * Obtém as vendas consolidadas e detalhadas por estado com filtros aplicados
     * @param {string} state - UF do estado (ex: 'SP')
     * @param {Object} filters - Filtros de busca (month, year, salesperson, branch)
     */
    async getSales(state, filters = {}) {
        if (!state) throw new Error('Estado (UF) é obrigatório');
        try {
            let salesQuery = `
                SELECT s.*, p.unit_volume as packaging_type 
                FROM sales_transactions s
                LEFT JOIN products_packaging p ON s.product_code = p.product_code
                WHERE s.state = $1
            `;
            const params = [state];
            let paramIndex = 2;

            if (filters.month) {
                salesQuery += ` AND s.ref_month = $${paramIndex++}`;
                params.push(parseInt(filters.month));
            }
            if (filters.year) {
                salesQuery += ` AND s.ref_year = $${paramIndex++}`;
                params.push(parseInt(filters.year));
            }
            if (filters.salesperson) {
                salesQuery += ` AND s.salesperson = $${paramIndex++}`;
                params.push(filters.salesperson);
            }
            if (filters.branch) {
                salesQuery += ` AND s.branch = $${paramIndex++}`;
                params.push(filters.branch);
            }

            salesQuery += ` ORDER BY s.sale_date DESC`;
            
            const salesResult = await poolAnalitico.query(salesQuery, params);
            
            const brandsQuery = `SELECT * FROM brand_configs`;
            const brandsResult = await poolAnalitico.query(brandsQuery);
            
            const brandConfigsMap = brandsResult.rows.reduce((acc, row) => {
                if (row.brand) {
                    acc[row.brand.trim()] = row;
                }
                return acc;
            }, {});

            return {
                transactions: salesResult.rows,
                brandConfigs: brandConfigsMap
            };
        } catch (error) {
            console.error('[DataSourceService] Erro ao buscar dados locais getSales:', error.message);
            throw error;
        }
    }

    /**
     * Obtém a lista de Estados distintos disponíveis na base de transações
     */
    async getAvailableStates() {
        try {
            const result = await poolAnalitico.query(`SELECT DISTINCT state FROM sales_transactions WHERE state IS NOT NULL ORDER BY state`);
            return result.rows.map(row => row.state);
        } catch (error) {
            console.error('[DataSourceService] Erro ao buscar estados disponíveis:', error.message);
            throw error;
        }
    }

    /**
     * Obtém os valores disponíveis para os filtros de select (branch, salesperson)
     */
    async getFiltersOptions(state) {
        if (!state) throw new Error('Estado (UF) é obrigatório');
        try {
            const result = await poolAnalitico.query(`
                SELECT DISTINCT salesperson, branch 
                FROM sales_transactions 
                WHERE state = $1 AND salesperson IS NOT NULL AND salesperson != ''
            `, [state]);

            const salespersons = new Set();
            const branches = new Set();

            result.rows.forEach(r => {
                if (r.salesperson) salespersons.add(r.salesperson);
                if (r.branch) branches.add(r.branch);
            });

            return {
                salespersons: Array.from(salespersons).sort(),
                branches: Array.from(branches).sort()
            };
        } catch (error) {
            console.error('[DataSourceService] Erro ao buscar filtros:', error.message);
            throw error;
        }
    }
}

export default new DataSourceService();

