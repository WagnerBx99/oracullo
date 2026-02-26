import express from 'express';
import dataSourceService from '../services/DataSourceService.js';
import { calculateSalesRow } from '../services/calculateSalesRow.js';
import ExcelJS from 'exceljs';
import ConsolidatedReportService from '../services/consolidated-report.service.js';
import {
    updateSaleCommission,
    updateUnitCost,
    updateCheckColumn
} from '../controllers/salesController.js';

const router = express.Router();

// Endpoint: Exportação Excel
router.get('/:state/sales/export', async (req, res) => {
    try {
        const state = req.params.state?.toUpperCase();
        if (!state || state.length !== 2) {
            return res.status(400).json({ error: 'Estado (UF) inválido.' });
        }

        const { month, year, salesperson, branch } = req.query;

        // Filtros mandatorios
        if (!month || !year) {
            return res.status(400).json({ error: 'Mês e Ano são filtros obrigatórios.' });
        }

        // Fetch de dados brutos
        const data = await dataSourceService.getSales(state, { month, year, salesperson, branch });

        // Processar os dados
        const processedTransactions = [];
        for (const t of data.transactions) {
            try {
                const config = data.brandConfigs[t.brand] || null;
                processedTransactions.push(calculateSalesRow(t, config));
            } catch (err) {
                if (err.message.includes('Configuração de marca ausente')) {
                    return res.status(422).json({ error: err.message });
                }
                throw err;
            }
        }

        // Criar a planilha Excel
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Relatório de Vendas');

        // Definir os cabeçalhos seguindo a ordem desejada na especificação do usuário
        sheet.columns = [
            { header: 'Cód Produto', key: 'product_code', width: 15 },
            { header: 'Data', key: 'sale_date', width: 15 },
            { header: 'Marca', key: 'brand', width: 20 },
            { header: 'Subgrupo', key: 'subgroup', width: 25 },
            { header: 'NF', key: 'invoice_number', width: 15 },
            { header: 'Cliente', key: 'client_name', width: 35 },
            { header: 'Filial', key: 'branch', width: 25 },
            { header: 'Vendedor', key: 'salesperson', width: 25 },
            { header: 'Prazo', key: 'payment_term', width: 15 },
            { header: 'Produto', key: 'product', width: 45 },
            { header: 'Venda Unit.', key: 'unit_price', width: 15 },
            { header: 'Qtd.', key: 'quantity', width: 10 },
            { header: 'Custo Unit.', key: 'unit_cost', width: 15 },
            { header: 'Custo Total', key: 'total_cost', width: 15 },
            { header: 'Venda Total', key: 'total_sale', width: 15 },
            { header: 'Litragem / Qtd.', key: 'liters_qty', width: 15 },
            { header: 'Comissão Vendedor %', key: 'salesperson_comm_pct', width: 20 },
            { header: 'Comissão Vendedor R$', key: 'salesperson_comm_rs', width: 20 },
            { header: 'Comissão Interna %', key: 'internal_comm_pct', width: 20 },
            { header: 'Comissão Interna R$', key: 'internal_comm_rs', width: 20 },
            { header: 'M. Bruta', key: 'gross_margin', width: 15 },
            { header: 'Coluna Conferência', key: 'check_column', width: 20 },
            { header: 'Custo Operacional %', key: 'operational_cost_pct', width: 20 },
            { header: 'Custo Operacional R$', key: 'operational_cost_rs', width: 20 },
            { header: 'Margem Líquida %', key: 'net_margin_pct', width: 20 },
            { header: 'Rentabilidade Líquida', key: 'net_profitability', width: 20 },
            { header: 'Mês', key: 'ref_month', width: 10 },
            { header: 'Ano', key: 'ref_year', width: 10 },
            { header: 'Embalagem', key: 'packaging_type', width: 15 }
        ];

        // Adicionar linhas com formatação básica onde ajuda (não obrigatório para back)
        processedTransactions.forEach(t => {
            // JS date se existir, para formatar no excel
            let dateVal = t.sale_date;
            try {
                const d = new Date(t.sale_date);
                if (!isNaN(d.getTime())) {
                    dateVal = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                }
            } catch (e) { }

            sheet.addRow({
                ...t,
                sale_date: dateVal,
                // Multiplicando por 100 para o Excel visualizar como % natural sem casas fixadas forçosamente
                salesperson_comm_pct: t.salesperson_comm_pct != null ? t.salesperson_comm_pct * 100 : t.salesperson_comm_pct,
                internal_comm_pct: t.internal_comm_pct != null ? t.internal_comm_pct * 100 : t.internal_comm_pct,
                gross_margin: t.gross_margin != null ? t.gross_margin * 100 : t.gross_margin,
                operational_cost_pct: t.operational_cost_pct != null ? t.operational_cost_pct * 100 : t.operational_cost_pct,
                net_margin_pct: t.net_margin_pct != null ? t.net_margin_pct * 100 : t.net_margin_pct
            });
        });

        // Retornar arquivo
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Vendas_${state}_${month}_${year}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('[ReportsController] Erro ao exportar Excel:', error);
        res.status(500).json({ error: 'Erro ao exportar relatório', details: error.message });
    }
});

// Endpoint: Exportação Excel Consolidado (Jan 25 A)
router.get('/:state/consolidated/export', async (req, res) => {
    try {
        const state = req.params.state?.toUpperCase();
        if (!state || state.length !== 2) {
            return res.status(400).json({ error: 'Estado (UF) inválido.' });
        }

        const { month, year } = req.query;

        // Filtros mandatorios
        if (!month || !year) {
            return res.status(400).json({ error: 'Mês e Ano são filtros obrigatórios.' });
        }

        // Fetch de dados brutos
        const data = await dataSourceService.getSales(state, { month, year });

        // Processar os dados
        const processedTransactions = [];
        for (const t of data.transactions) {
            try {
                const brandKey = t.brand ? t.brand.trim() : '';
                const config = data.brandConfigs[brandKey] || null;
                processedTransactions.push(calculateSalesRow(t, config));
            } catch (err) {
                if (err.message.includes('Configuração de marca ausente')) {
                    return res.status(422).json({ error: err.message });
                }
                throw err;
            }
        }

        const consolidatedView = ConsolidatedReportService.buildConsolidatedView(processedTransactions, data.brandConfigs);

        // Criar a planilha Excel
        const workbook = new ExcelJS.Workbook();

        const buildColumns = (isConsolidated) => {
            const cols = [
                { header: 'Marca', key: 'brand', width: 25 },
                { header: 'Rank.', key: 'rank', width: 15 },
                { header: 'Faturamento', key: 'revenue', width: 20 },
                { header: 'Custo', key: 'cost', width: 20 },
                { header: 'Litros / Qtd.', key: 'liters_qty', width: 15 },
                { header: 'Ticket Médio', key: 'avg_ticket', width: 15 },
                { header: 'M. Bruta %', key: 'gross_margin', width: 15 },
                { header: 'Custo Oper. %', key: 'operational_cost_pct', width: 15 },
                { header: 'Custo Oper. R$', key: 'operational_cost_rs', width: 20 },
                { header: 'M. Líquida %', key: 'net_margin_pct', width: 15 },
                { header: 'Rentab. Líquida', key: 'net_profitability', width: 20 },
                { header: 'Comissão Vendedor %', key: 'salesperson_comm_pct', width: 20 },
                { header: 'Comissão Vendedor R$', key: 'salesperson_comm_rs', width: 20 },
                { header: 'Comissão Interna %', key: 'internal_comm_pct', width: 20 },
                { header: 'Comissão Interna R$', key: 'internal_comm_rs', width: 20 }
            ];

            if (isConsolidated) {
                cols.push({ header: 'Comissão Gerente %', key: 'manager_comm_pct', width: 20 });
                cols.push({ header: 'Comissão Gerente R$', key: 'manager_comm_rs', width: 20 });
            }

            return cols;
        };

        const formatPct = (val) => val != null ? val * 100 : val;

        const populateSheet = (sheet, title, brands, isConsolidated) => {
            // Título
            sheet.addRow([title]);
            sheet.getRow(sheet.rowCount).font = { bold: true, size: 14 };
            sheet.addRow([]); // Blank line

            // Header manual
            const cols = buildColumns(isConsolidated);
            sheet.addRow(cols.map(c => c.header));
            sheet.getRow(sheet.rowCount).font = { bold: true };

            brands.forEach(b => {
                const rowObj = {
                    brand: b.brand,
                    rank: formatPct(b.rank),
                    revenue: b.revenue,
                    cost: b.cost,
                    liters_qty: b.liters_qty,
                    avg_ticket: b.avg_ticket,
                    gross_margin: formatPct(b.gross_margin),
                    operational_cost_pct: formatPct(b.operational_cost_pct),
                    operational_cost_rs: b.operational_cost_rs,
                    net_margin_pct: formatPct(b.net_margin_pct),
                    net_profitability: b.net_profitability,
                    salesperson_comm_pct: formatPct(b.salesperson_comm_pct),
                    salesperson_comm_rs: b.salesperson_comm_rs,
                    internal_comm_pct: formatPct(b.internal_comm_pct),
                    internal_comm_rs: b.internal_comm_rs
                };

                if (isConsolidated) {
                    rowObj.manager_comm_pct = formatPct(b.manager_comm_pct);
                    rowObj.manager_comm_rs = b.manager_comm_rs;
                }

                const rowArray = cols.map(c => rowObj[c.key]);
                sheet.addRow(rowArray);

                if (b.brand === 'TOTAL') {
                    sheet.getRow(sheet.rowCount).font = { bold: true };
                }
            });
            sheet.addRow([]); // Blank
            sheet.addRow([]); // Blank
        };

        // Tab: Vendedor
        const sheetVendedor = workbook.addWorksheet('Por Vendedor');
        sheetVendedor.columns = buildColumns(false); // Define col widths globalmente pra tab
        consolidatedView.by_salesperson.forEach(spObj => {
            populateSheet(sheetVendedor, `Vendedor: ${spObj.salesperson}`, spObj.brands, false);
        });

        // Tab: Filial
        const sheetFilial = workbook.addWorksheet('Por Filial');
        sheetFilial.columns = buildColumns(false);
        consolidatedView.by_branch.forEach(brObj => {
            populateSheet(sheetFilial, `Filial: ${brObj.branch}`, brObj.brands, false);
        });

        // Tab: Consolidado Geral
        const sheetConsolidado = workbook.addWorksheet('Consolidado');
        sheetConsolidado.columns = buildColumns(true);
        populateSheet(sheetConsolidado, 'Resumo do Estado', consolidatedView.consolidated.brands, true);

        // Retornar arquivo
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Consolidado_${state}_${month}_${year}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('[ReportsController] Erro ao exportar Excel Consolidado:', error);
        res.status(500).json({ error: 'Erro ao exportar relatório', details: error.message });
    }
});

// Endpoint: Buscar Estados Disponíveis
router.get('/states', async (req, res) => {
    try {
        const states = await dataSourceService.getAvailableStates();
        res.json(states);
    } catch (error) {
        console.error('[ReportsController] Erro ao buscar estados:', error);
        res.status(500).json({ error: 'Erro ao buscar estados disponíveis', details: error.message });
    }
});

// Endpoint: Filtros Disponíveis
router.get('/:state/sales/filters', async (req, res) => {
    try {
        const state = req.params.state?.toUpperCase();
        if (!state || state.length !== 2) {
            return res.status(400).json({ error: 'Estado (UF) inválido.' });
        }

        const filters = await dataSourceService.getFiltersOptions(state);
        res.json(filters);
    } catch (error) {
        console.error('[ReportsController] Erro ao buscar filtros:', error);
        res.status(500).json({ error: 'Erro ao buscar filtros', details: error.message });
    }
});

// Endpoint: Atualizar Comissão Manualmente (Feature Inline Edit)
router.patch('/sales/:id/commission', updateSaleCommission);

// Endpoint:// Atualiza o Custo Unitário (Edição Inline)
router.patch('/sales/:id/cost', updateUnitCost);

// Atualiza a Coluna de Conferência (Edição Inline)
router.patch('/sales/:id/check', updateCheckColumn);

// Endpoint: Relatório de Vendas Principal
router.get('/:state/sales', async (req, res) => {
    try {
        const state = req.params.state?.toUpperCase();
        if (!state || state.length !== 2) {
            return res.status(400).json({ error: 'Estado (UF) inválido.' });
        }

        const { month, year, salesperson, branch, page = 1, page_size = 50 } = req.query;

        // Filtros mandatorios
        if (!month || !year) {
            return res.status(400).json({ error: 'Mês e Ano são filtros obrigatórios.' });
        }

        // Paging parsing
        const parsedPage = parseInt(page, 10);
        const parsedPageSize = parseInt(page_size, 10);
        const limit = Math.min(parsedPageSize, 200);

        // Fetch de dados brutos
        const data = await dataSourceService.getSales(state, {
            month,
            year,
            salesperson,
            branch
        });

        // 1. Processar todas as linhas pela Regra de Negócio (Módulo Puro)
        const processedTransactions = [];

        for (const t of data.transactions) {
            try {
                const brandKey = t.brand ? t.brand.trim() : '';
                const config = data.brandConfigs[brandKey] || null;
                processedTransactions.push(calculateSalesRow(t, config));
            } catch (err) {
                if (err.message.includes('Configuração de marca ausente')) {
                    return res.status(422).json({ error: err.message });
                }
                throw err;
            }
        }

        // 2. Calcular o Sumário Total
        let total_sale = 0;
        let total_cost = 0;
        let total_liters = 0;
        let sum_gross_margin = 0;
        let sum_net_margin = 0;

        processedTransactions.forEach(t => {
            total_sale += t.total_sale || 0;
            total_cost += t.total_cost || 0;
            total_liters += Number(t.liters_qty) || 0;
            sum_gross_margin += t.gross_margin || 0;
            sum_net_margin += t.net_margin_pct || 0;
        });

        const numTx = processedTransactions.length;
        const avg_gross_margin = numTx > 0 ? (sum_gross_margin / numTx) : 0;
        const avg_net_margin = numTx > 0 ? (sum_net_margin / numTx) : 0;

        // 3. Paginar os resultados
        const totalRows = processedTransactions.length;
        const totalPages = Math.ceil(totalRows / limit);
        const offset = (parsedPage - 1) * limit;

        const paginatedData = processedTransactions.slice(offset, offset + limit);

        res.json({
            data: paginatedData,
            pagination: {
                page: parsedPage,
                page_size: limit,
                total: totalRows,
                total_pages: totalPages
            },
            summary: {
                total_sale: Number(total_sale.toFixed(2)),
                total_cost: Number(total_cost.toFixed(2)),
                total_liters: Number(total_liters.toFixed(2)),
                avg_gross_margin: Number(avg_gross_margin.toFixed(4)),
                avg_net_margin: Number(avg_net_margin.toFixed(4))
            }
        });

    } catch (error) {
        console.error('[ReportsController] Erro ao buscar relatório:', error);
        res.status(500).json({ error: 'Erro ao buscar relatório', details: error.message });
    }
});

// Endpoint: Relatório Consolidado (Jan 25 A)
router.get('/:state/consolidated', async (req, res) => {
    try {
        const state = req.params.state?.toUpperCase();
        if (!state || state.length !== 2) {
            return res.status(400).json({ error: 'Estado (UF) inválido.' });
        }

        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ error: 'Mês e Ano são filtros obrigatórios.' });
        }

        // Busca transações base (sem filtro de vendedor/filial)
        const data = await dataSourceService.getSales(state, {
            month,
            year
        });

        // 1. Processar todas as linhas pela Regra de Negócio Pura base
        const processedTransactions = [];
        for (const t of data.transactions) {
            try {
                const brandKey = t.brand ? t.brand.trim() : '';
                const config = data.brandConfigs[brandKey] || null;
                processedTransactions.push(calculateSalesRow(t, config));
            } catch (err) {
                if (err.message.includes('Configuração de marca ausente')) {
                    return res.status(422).json({ error: err.message });
                }
                throw err;
            }
        }

        // 2. Monta as fatias do relatório usando o Agregator
        const consolidatedView = ConsolidatedReportService.buildConsolidatedView(processedTransactions, data.brandConfigs);

        res.json(consolidatedView);

    } catch (error) {
        console.error('[ReportsController] Erro ao buscar relatório consolidado:', error);
        res.status(500).json({ error: 'Erro ao buscar relatório consolidado', details: error.message });
    }
});

export default router;
