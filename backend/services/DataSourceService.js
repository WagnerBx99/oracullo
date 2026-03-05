import { poolAnalitico, poolGestao } from '../config/databases.js';

export class DataSourceService {
    async getSales(units, filters = {}) {
        if (!units) throw new Error('Unidade é obrigatória');
        const unitList = Array.isArray(units) ? units : [units];
        const isAll = unitList.includes('all');
        const realUnits = isAll ? [] : unitList.filter(u => u !== 'TRADING' && u !== 'ATF6000');

        try {
            let salesQuery = `
                SELECT s.*, p.unit_volume as packaging_type
                FROM sales_transactions s
                LEFT JOIN products_packaging p ON s.product_code = p.product_code
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (!isAll && realUnits.length > 0) {
                salesQuery += ` AND s.branch = ANY($${paramIndex++})`;
                params.push(realUnits);
            }
            if (filters.month) {
                salesQuery += ` AND s.ref_month = $${paramIndex++}`;
                params.push(parseInt(filters.month));
            }
            if (filters.year) {
                salesQuery += ` AND s.ref_year = $${paramIndex++}`;
                params.push(parseInt(filters.year));
            }
            
            // LIMIT de segurança para o Frontend não travar na apresentação
            salesQuery += ` ORDER BY s.sale_date DESC LIMIT 200`;

            const salesResult = await poolAnalitico.query(salesQuery, params);
            let allTransactions = [...salesResult.rows];

            // Adiciona Mocks apenas se for a primeira carga ou "all"
            const mockUnits = isAll ? ['TRADING', 'ATF6000'] : unitList.filter(u => u === 'TRADING' || u === 'ATF6000');
            for (const mUnit of mockUnits) {
                allTransactions.push({
                    id: mUnit, branch: mUnit, client_name: `DEMO ${mUnit}`, 
                    total_sale: 5000, sale_date: new Date(), ref_month: filters.month || 2, ref_year: filters.year || 2026
                });
            }

            const brandsResult = await poolAnalitico.query(`SELECT * FROM brand_configs`);
            const brandConfigsMap = brandsResult.rows.reduce((acc, row) => {
                if (row.brand) acc[row.brand.trim()] = row;
                return acc;
            }, {});

            // Retornando EXATAMENTE a estrutura original para não quebrar o React
            return { 
                data: allTransactions, 
                pagination: { 
                    page: parseInt(filters.page) || 1, 
                    total: allTransactions.length, 
                    total_pages: 1 
                },
                summary: { 
                    total_records: allTransactions.length 
                },
                brandConfigs: brandConfigsMap 
            };

        } catch (error) {
            console.error('[DataSourceService] Erro:', error.message);
            throw error;
        }
    }

    async getDailyBilling(units, filters = {}) {
        if (!units) throw new Error("Unidade é obrigatória");

        const unitList = Array.isArray(units) ? units : [units];
        const isAll = unitList.includes("all");
        const realUnits = isAll ? [] : unitList.filter(u => u !== "TRADING" && u !== "ATF6000");
        const mockUnits = unitList.filter(u => u === "TRADING" || u === "ATF6000");

        try {
            let dailyData = {};
            let totalPeriodo = 0;

            // 1. Buscar dados reais para filiais OMIE
            if (realUnits.length > 0) {
                let salesQuery = `
                    SELECT
                        DATE_TRUNC('day', s.sale_date) AS day,
                        SUM(s.total_sale) AS valor
                    FROM sales_transactions s
                    WHERE 1=1
                `;
                const params = [];
                let paramIndex = 1;

                if (!isAll) {
                    salesQuery += ` AND s.branch = ANY($${paramIndex++})`;
                    params.push(realUnits);
                }

                if (filters.month) {
                    salesQuery += ` AND s.ref_month = $${paramIndex++}`;
                    params.push(parseInt(filters.month));
                }
                if (filters.year) {
                    salesQuery += ` AND s.ref_year = $${paramIndex++}`;
                    params.push(parseInt(filters.year));
                }

                salesQuery += ` GROUP BY DATE_TRUNC('day', s.sale_date) ORDER BY day`;
                const salesResult = await poolAnalitico.query(salesQuery, params);

                salesResult.rows.forEach(row => {
                    const day = new Date(row.day).toISOString().split('T')[0];
                    dailyData[day] = (dailyData[day] || 0) + parseFloat(row.valor);
                    totalPeriodo += parseFloat(row.valor);
                });
            }

            // 2. Adicionar MOCK DATA para Trading e ATF6000
            if (mockUnits.length > 0) {
                const year = parseInt(filters.year) || new Date().getFullYear();
                const month = parseInt(filters.month) || new Date().getMonth() + 1;
                const daysInMonth = new Date(year, month, 0).getDate();

                for (const mUnit of mockUnits) {
                    for (let i = 1; i <= daysInMonth; i++) {
                        const day = new Date(year, month - 1, i).toISOString().split('T')[0];
                        const mockValue = Math.floor(Math.random() * 1000) + 100;
                        dailyData[day] = (dailyData[day] || 0) + mockValue;
                        totalPeriodo += mockValue;
                    }
                }
            }

            const formattedData = Object.keys(dailyData).sort().map(day => ({
                day: day,
                valor: parseFloat(dailyData[day].toFixed(2))
            }));

            return {
                data: formattedData,
                summary: {
                    total_periodo: parseFloat(totalPeriodo.toFixed(2))
                }
            };

        } catch (error) {
            console.error("[DataSourceService] Erro ao buscar faturamento diário:", error.message);
            throw error;
        }
    }

    async getAvailableStates() {
        const result = await poolGestao.query("SELECT DISTINCT nome FROM integracoes WHERE status = 'conectado' ORDER BY nome");
        const units = result.rows.map(row => row.nome);
        if (!units.includes('TRADING')) units.push('TRADING');
        if (!units.includes('ATF6000')) units.push('ATF6000');
        return units.sort();
    }

    async getFiltersOptions(units) {
        const salespersonsResult = await poolAnalitico.query(`SELECT DISTINCT vendedor FROM comissoes_consolidadas ORDER BY vendedor LIMIT 100`);
        return { salespersons: salespersonsResult.rows.map(r => r.vendedor), branches: await this.getAvailableStates() };
    }
}

export default new DataSourceService();
