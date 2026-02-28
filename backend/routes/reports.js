import express from 'express';
import dataSourceService from '../services/DataSourceService.js';
import { calculateSalesRow } from '../services/calculateSalesRow.js';
import ExcelJS from 'exceljs';
import ConsolidatedReportService from '../services/consolidated-report.service.js';
import DailyBillingService from '../services/DailyBillingService.js';
import DailyBillingConsolidatedService from '../services/DailyBillingConsolidatedService.js';
import AnnualConsolidatedService from '../services/AnnualConsolidatedService.js';
import {
    updateSaleCommission,
    updateUnitCost,
    updateCheckColumn
} from '../controllers/salesController.js';

const router = express.Router();

// Endpoint: Exportação Excel Faturamento Diário Resumido
router.get('/export/daily-billing', async (req, res) => {
    try {
        const statesParam = req.query.states;
        const year = req.query.year;
        const month = req.query.month;
        const startDay = parseInt(req.query.startDay, 10) || 1;
        const endDay = parseInt(req.query.endDay, 10) || 31;
        const reportType = req.query.reportType || 'vendedores'; // 'vendedores' or 'consolidado'
        const salesperson = req.query.salesperson || '';
        const branch = req.query.branch || '';

        if (!statesParam || !year || !month) {
            return res.status(400).json({ error: 'Estados, Ano e Mês são obrigatórios para a exportação diária.' });
        }

        const states = statesParam.split(',').map(s => s.trim().toUpperCase());
        const S = Math.max(1, startDay);
        const E = Math.max(S, endDay);
        const targetDays = [];
        for (let i = S; i <= E; i++) targetDays.push(i);

        const workbook = new ExcelJS.Workbook();
        const monthStr = month.toString().padStart(2, '0');

        for (const uf of states) {
            try {
                let report;
                if (reportType === 'consolidado') {
                    report = await DailyBillingConsolidatedService.buildDailyBillingConsolidatedReport(uf, { month, year, branch });
                } else {
                    report = await DailyBillingService.buildDailyBillingReport(uf, { month, year, salesperson, branch });
                }

                if (!report.data || report.data.length === 0) continue;

                const sheet = workbook.addWorksheet(`Fat ${uf}`);

                // Build Headers
                const headers = ['Filial'];
                if (reportType === 'vendedores') {
                    headers.push('Vendedor');
                } else {
                    headers.push('Marca'); // Though not strictly separate columns in UI, Excel often splits them out better or we indent. Wait, the UI uses one column for Filial/Marca nesting. Let's match UI carefully.
                }

                targetDays.forEach(d => {
                    headers.push(`${d.toString().padStart(2, '0')}/${monthStr}`);
                });
                headers.push('Total Mensal');

                // Adjust headers if we want to mimic the single-column visual hierarchy of "Consolidado"
                if (reportType === 'consolidado') {
                    headers[0] = 'Filial / Marca';
                    headers.splice(1, 1); // remove the explicit 'Marca' column we just conditionally added to match standard 1 column style
                }

                sheet.addRow(headers);
                const headerRow = sheet.getRow(1);
                headerRow.font = { bold: true };
                headerRow.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; // slate-50 UI header color loosely translated
                });
                sheet.getColumn(1).width = 25;
                if (reportType === 'vendedores') {
                    sheet.getColumn(2).width = 25;
                }

                // Col widths for days
                let dayColStart = reportType === 'vendedores' ? 3 : 2;
                for (let i = 0; i < targetDays.length; i++) {
                    sheet.getColumn(dayColStart + i).width = 15;
                    headerRow.getCell(dayColStart + i).alignment = { horizontal: 'right' };
                }
                sheet.getColumn(dayColStart + targetDays.length).width = 20; // Total
                headerRow.getCell(dayColStart + targetDays.length).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }; // blue-50 
                headerRow.getCell(dayColStart + targetDays.length).alignment = { horizontal: 'right' };

                const formatRowAmounts = (addedRow) => {
                    for (let i = 0; i < targetDays.length; i++) {
                        const cell = addedRow.getCell(dayColStart + i);
                        cell.numFmt = '"R$" #,##0.00;[Red]\-"R$" #,##0.00';
                        if (cell.value === 0) cell.value = '-'; // Match UI dashboard "-" 
                    }
                    const totalCell = addedRow.getCell(dayColStart + targetDays.length);
                    totalCell.numFmt = '"R$" #,##0.00;[Red]\-"R$" #,##0.00';
                    totalCell.font = { bold: true, color: { argb: 'FF1D4ED8' } }; // blue-700
                    totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } }; // blue-50/50 approx
                };

                if (reportType === 'vendedores') {
                    report.data.forEach(row => {
                        const r = [row.branch, row.salesperson];
                        targetDays.forEach(d => r.push(row[`day_${d}`] || 0));
                        r.push(row.total || 0);

                        const addedRow = sheet.addRow(r);
                        formatRowAmounts(addedRow);
                    });
                } else {
                    // Consolidado nested logic
                    report.data.forEach(branchObj => {
                        // Branch header
                        const rBranch = [branchObj.branch];
                        targetDays.forEach(d => rBranch.push(branchObj[`day_${d}`] || 0));
                        rBranch.push(branchObj.total || 0);

                        const bRow = sheet.addRow(rBranch);
                        bRow.font = { bold: true };
                        bRow.eachCell(c => {
                            if (!c.fill || c.fill.fgColor?.argb === '00000000') {
                                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
                            }
                        });
                        formatRowAmounts(bRow);

                        // Brands under branch
                        if (branchObj.brands) {
                            branchObj.brands.forEach(brandObj => {
                                const rBrand = [brandObj.brand];
                                targetDays.forEach(d => rBrand.push(brandObj[`day_${d}`] || 0));
                                rBrand.push(brandObj.total || 0);

                                const brRow = sheet.addRow(rBrand);
                                brRow.getCell(1).alignment = { indent: 2 };
                                formatRowAmounts(brRow);
                            });
                        }
                    });
                }

                // Add Summary Line
                if (report.summary) {
                    const rSum = ['TOTAL'];
                    if (reportType === 'vendedores') rSum.push('-');
                    targetDays.forEach(d => rSum.push(report.summary[`day_${d}`] || 0));
                    rSum.push(report.summary.total || 0);

                    const sRow = sheet.addRow(rSum);
                    sRow.font = { bold: true, color: { argb: 'FF334155' } };
                    sRow.eachCell((c, cNum) => {
                        const isTotalCol = cNum === (dayColStart + targetDays.length);
                        if (!isTotalCol) {
                            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100/800
                        }
                    });
                    formatRowAmounts(sRow);
                }

            } catch (err) {
                console.error(`Erro processando aba ${uf} no export diario: `, err);
            }
        }

        if (workbook.worksheets.length === 0) {
            const infoSheet = workbook.addWorksheet('Aviso');
            infoSheet.addRow(['Nenhum dado encontrado para os filtros informados.']);
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Faturamento_Diario_${monthStr}_${year}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('[ReportsController] Erro ao exportar Excel Diário:', error);
        res.status(500).json({ error: 'Erro ao exportar relatório diário', details: error.message });
    }
});

// Endpoint: Exportação Excel Vendas GERAL (Faturamento por Estado)
router.get('/export/sales-state', async (req, res) => {
    try {
        const { state, month, year, salesperson, branch } = req.query;
        if (!state) return res.status(400).json({ error: 'Estado (UF) obrigatório no query param.' });
        if (!month || !year) return res.status(400).json({ error: 'Mês e Ano são filtros obrigatórios.' });

        const uf = state.toUpperCase();

        // Fetch de dados brutos
        const data = await dataSourceService.getSales(uf, { month, year, salesperson, branch });

        // Processar os dados
        const processedTransactions = [];
        let total_sale = 0, total_cost = 0, total_liters = 0, sum_gross_margin = 0, sum_net_margin = 0;

        for (const t of data.transactions) {
            try {
                const config = data.brandConfigs[t.brand] || null;
                const row = calculateSalesRow(t, config);
                processedTransactions.push(row);

                total_sale += row.total_sale || 0;
                total_cost += row.total_cost || 0;
                total_liters += Number(row.liters_qty) || 0;
                sum_gross_margin += row.gross_margin || 0;
                sum_net_margin += row.net_margin_pct || 0;
            } catch (err) {
                if (err.message.includes('Configuração de marca ausente')) {
                    return res.status(422).json({ error: err.message });
                }
                throw err;
            }
        }

        const numTx = processedTransactions.length;
        const avg_gross_margin = numTx > 0 ? (sum_gross_margin / numTx) : 0;
        const avg_net_margin = numTx > 0 ? (sum_net_margin / numTx) : 0;

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Relatório de Vendas');

        // Headers idênticos ao componente `SalesReportTable.jsx`
        const headerDef = [
            { h: 'Cód', w: 10, col: 'product_code', isStr: true },
            { h: 'Data', w: 12, col: 'sale_date', isStr: true },
            { h: 'Marca', w: 15, col: 'brand', isStr: true },
            { h: 'Subgrupo', w: 20, col: 'subgroup', isStr: true },
            { h: 'NF', w: 12, col: 'invoice_number', isStr: true },
            { h: 'Cliente', w: 35, col: 'client_name', isStr: true },
            { h: 'Filial', w: 20, col: 'branch', isStr: true },
            { h: 'Vendedor', w: 25, col: 'salesperson', isStr: true },
            { h: 'Prazo', w: 12, col: 'payment_term', isStr: true },
            { h: 'Produto', w: 40, col: 'product', isStr: true },
            { h: 'Venda Unit.', w: 15, col: 'unit_price', isRs: true },
            { h: 'Qtd.', w: 10, col: 'quantity', formatTxt: '#,##0' },
            { h: 'Custo Unit.', w: 15, col: 'unit_cost', isRs: true },
            { h: 'Custo Total', w: 15, col: 'total_cost', isRs: true },
            { h: 'Venda Total', w: 15, col: 'total_sale', isRs: true },
            { h: 'Litragem', w: 12, col: 'liters_qty', formatTxt: '#,##0.00' },
            { h: 'Com. Vend. %', w: 15, col: 'salesperson_comm_pct', isPct: true, color: 'FFEFF6FF', fgColor: 'FF1D4ED8' },
            { h: 'Com. Vend. R$', w: 15, col: 'salesperson_comm_rs', isRs: true, color: 'FFEFF6FF', fgColor: 'FF1D4ED8' },
            { h: 'Com. Int. %', w: 15, col: 'internal_comm_pct', isPct: true, color: 'FFF3E8FF', fgColor: 'FF6D28D9' },
            { h: 'Com. Int. R$', w: 15, col: 'internal_comm_rs', isRs: true, color: 'FFF3E8FF', fgColor: 'FF6D28D9' },
            { h: 'M. Bruta %', w: 15, col: 'gross_margin', isPct: true },
            { h: 'Conferência', w: 15, col: 'check_column', isRs: true, color: 'FFFFFBEB' },
            { h: 'Custo Oper. %', w: 15, col: 'operational_cost_pct', isPct: true },
            { h: 'Custo Oper. R$', w: 15, col: 'operational_cost_rs', isRs: true, fgColor: 'FFEA580C' },
            { h: 'M. Líq. %', w: 15, col: 'net_margin_pct', isPct: true },
            { h: 'Rentab. Líq.', w: 18, col: 'net_profitability', isRs: true, bold: true },
            { h: 'Mês', w: 8, col: 'ref_month', isStr: true },
            { h: 'Ano', w: 8, col: 'ref_year', isStr: true },
            { h: 'Embalagem', w: 15, col: 'packaging_type', isStr: true }
        ];

        sheet.columns = headerDef.map(c => ({
            header: c.h,
            key: c.col,
            width: c.w
        }));

        const r1 = sheet.getRow(1);
        r1.font = { bold: true };
        headerDef.forEach((c, idx) => {
            const cell = r1.getCell(idx + 1);
            if (c.color) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.color } };
            } else {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            }
        });

        const formatDate = (val) => {
            if (!val) return '-';
            try { return new Intl.DateTimeFormat('pt-BR').format(new Date(val)); } catch { return val; }
        };

        processedTransactions.forEach((t) => {
            const rowData = {};
            headerDef.forEach(c => {
                let v = t[c.col];
                if (c.col === 'sale_date') v = formatDate(v);
                rowData[c.col] = v;
            });
            const r = sheet.addRow(rowData);

            // Format cells
            headerDef.forEach((c, idx) => {
                const cell = r.getCell(idx + 1);
                if (c.isRs) cell.numFmt = '"R$" #,##0.00;[Red]\-"R$" #,##0.00';
                if (c.isPct) cell.numFmt = '0.00%';
                if (c.formatTxt) cell.numFmt = c.formatTxt;
                if (c.color) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.color } };
                }
                if (c.bold) cell.font = { bold: true };
                if (c.fgColor) {
                    cell.font = { ...cell.font, color: { argb: c.fgColor } };
                }
            });
        });

        // Summary Row
        if (numTx > 0) {
            sheet.addRow([]);
            const sumRow = sheet.addRow({
                client_name: 'TOTAIS DA PÁGINA (RESUMO DE FILTROS):',
                total_cost: total_cost,
                total_sale: total_sale,
                liters_qty: total_liters,
                gross_margin: avg_gross_margin,
                net_margin_pct: avg_net_margin
            });
            sumRow.font = { bold: true, size: 12 };
            sumRow.eachCell((c) => {
                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                if (c._column.key === 'total_cost' || c._column.key === 'total_sale') c.numFmt = '"R$" #,##0.00;[Red]\-"R$" #,##0.00';
                if (c._column.key === 'gross_margin' || c._column.key === 'net_margin_pct') c.numFmt = '0.00%';
            });
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Vendas_${uf}_${month}_${year}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('[ReportsController] Erro ao exportar Excel:', error);
        res.status(500).json({ error: 'Erro ao exportar relatório', details: error.message });
    }
});

// Endpoint: Exportação Excel Consolidado (Faturamento Estado A)
router.get('/export/consolidated-state', async (req, res) => {
    try {
        const { state, month, year } = req.query;
        if (!state) return res.status(400).json({ error: 'Estado (UF) obrigatório no query param.' });
        if (!month || !year) return res.status(400).json({ error: 'Mês e Ano são filtros obrigatórios.' });

        const uf = state.toUpperCase();
        const data = await dataSourceService.getSales(uf, { month, year });

        const processedTransactions = [];
        for (const t of data.transactions) {
            try {
                const config = data.brandConfigs[t.brand ? t.brand.trim() : ''] || null;
                processedTransactions.push(calculateSalesRow(t, config));
            } catch (err) {
                if (err.message.includes('Configuração de marca ausente')) {
                    return res.status(422).json({ error: err.message });
                }
                throw err;
            }
        }

        const consolidatedView = ConsolidatedReportService.buildConsolidatedView(processedTransactions, data.brandConfigs);
        const workbook = new ExcelJS.Workbook();

        const buildCols = (isConsolidado) => {
            const cols = [
                { header: 'Marca', key: 'brand', width: 40 },
                { header: 'Rank.', key: 'rank', width: 10, isPct: true },
                { header: 'Faturamento', key: 'revenue', width: 18, isRs: true },
                { header: 'Custo Total', key: 'cost', width: 18, isRs: true },
                { header: 'Litros', key: 'liters_qty', width: 12, num: '#,##0.00' },
                { header: 'Ticket Médio', key: 'avg_ticket', width: 15, isRs: true },
                { header: 'M. Bruta %', key: 'gross_margin', width: 15, isPct: true },
                { header: 'Custo Oper. %', key: 'operational_cost_pct', width: 15, isPct: true },
                { header: 'Custo Oper. R$', key: 'operational_cost_rs', width: 15, isRs: true },
                { header: 'M. Líquida %', key: 'net_margin_pct', width: 15, isPct: true },
                { header: 'Rentab. Líquida', key: 'net_profitability', width: 18, isRs: true },
                { header: 'Comissão Vendedor %', key: 'salesperson_comm_pct', width: 22, isPct: true },
                { header: 'Comissão Vendedor R$', key: 'salesperson_comm_rs', width: 22, isRs: true },
                { header: 'Comissão Interna %', key: 'internal_comm_pct', width: 20, isPct: true },
                { header: 'Comissão Interna R$', key: 'internal_comm_rs', width: 20, isRs: true }
            ];
            if (isConsolidado) {
                cols.push({ header: 'Com. Gerente %', key: 'manager_comm_pct', width: 18, isPct: true });
                cols.push({ header: 'Com. Gerente R$', key: 'manager_comm_rs', width: 18, isRs: true });
            }
            return cols;
        };

        const populateSheet = (sheet, title, sourceData, isConsolidado) => {
            sheet.addRow([title]);
            sheet.getRow(sheet.rowCount).font = { bold: true, size: 14, color: { argb: 'FF1E293B' } };
            sheet.addRow([]); // Blank

            const cols = buildCols(isConsolidado);
            sheet.columns = cols.map(c => ({ header: c.header, key: c.key, width: c.width }));

            const headerRow = sheet.getRow(3);
            headerRow.font = { bold: true, color: { argb: 'FF334155' } };
            headerRow.eachCell(c => {
                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            });

            // Iterate UI matching structure (Total generally prepended at the end of groups)
            sourceData.forEach(b => {
                const r = sheet.addRow(b);
                const isTotal = (b.brand === 'TOTAL');

                if (isTotal) {
                    r.font = { bold: true };
                    r.eachCell(c => c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } });
                }

                cols.forEach((c, idx) => {
                    const cell = r.getCell(idx + 1);
                    if (c.isRs) cell.numFmt = '"R$" #,##0.00;[Red]\-"R$" #,##0.00';
                    if (c.isPct) cell.numFmt = '0.00%';
                    if (c.num) cell.numFmt = c.num;

                    if (c.key === 'net_margin_pct' && !isTotal) {
                        if (b.net_margin_pct > 0.3) cell.font = { color: { argb: 'FF059669' }, bold: true };
                        else if (b.net_margin_pct > 0.1) cell.font = { color: { argb: 'FFD97706' }, bold: true };
                        else cell.font = { color: { argb: 'FFDC2626' }, bold: true };
                    }
                });
            });

            sheet.addRow([]);
        };

        const sheetVendedor = workbook.addWorksheet('Por Vendedor');
        consolidatedView.by_salesperson.forEach(spObj => populateSheet(sheetVendedor, `Vendedor: ${spObj.salesperson}`, spObj.brands, false));

        const sheetFilial = workbook.addWorksheet('Por Filial');
        consolidatedView.by_branch.forEach(brObj => populateSheet(sheetFilial, `Filial: ${brObj.branch}`, brObj.brands, false));

        const sheetConsolidado = workbook.addWorksheet('Consolidado');
        populateSheet(sheetConsolidado, 'Resumo do Estado', consolidatedView.consolidated.brands, true);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Consolidado_${uf}_${month}_${year}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('[ReportsController] Erro ao exportar Excel Consolidado:', error);
        res.status(500).json({ error: 'Erro ao exportar relatório consolidado', details: error.message });
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
                // Se a marca estiver ausente, apenas ignora a linha ou usa valores zerados em vez de travar o relatório todo
                console.warn(`[Reports] Pulando linha devido a erro: ${err.message}`);
                continue;
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
                // Se a marca estiver ausente, apenas ignora a linha ou usa valores zerados em vez de travar o relatório todo
                console.warn(`[Reports] Pulando linha devido a erro: ${err.message}`);
                continue;
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

// Endpoint: Relatório de Faturamento Diário Resumido
router.get('/:state/daily-billing', async (req, res) => {
    try {
        const state = req.params.state?.toUpperCase();
        if (!state || state.length !== 2) {
            return res.status(400).json({ error: 'Estado (UF) inválido.' });
        }

        const { month, year, salesperson, branch } = req.query;

        if (!month || !year) {
            return res.status(400).json({ error: 'Mês e Ano são filtros obrigatórios.' });
        }

        const report = await DailyBillingService.buildDailyBillingReport(state, {
            month,
            year,
            salesperson,
            branch
        });

        res.json(report);
    } catch (error) {
        console.error('[ReportsController] Erro ao buscar relatório de faturamento diário:', error);
        res.status(500).json({ error: 'Erro ao buscar faturamento diário', details: error.message });
    }
});

// Endpoint: Relatório de Faturamento Diário Consolidado (Filial -> Marca)
router.get('/:state/daily-billing-consolidated', async (req, res) => {
    try {
        const state = req.params.state?.toUpperCase();
        if (!state || state.length !== 2) {
            return res.status(400).json({ error: 'Estado (UF) inválido.' });
        }

        const { month, year, branch } = req.query;

        if (!month || !year) {
            return res.status(400).json({ error: 'Mês e Ano são filtros obrigatórios.' });
        }

        const report = await DailyBillingConsolidatedService.buildDailyBillingConsolidatedReport(state, {
            month,
            year,
            branch
        });

        res.json(report);
    } catch (error) {
        console.error('[ReportsController] Erro ao buscar faturamento diário consolidado:', error);
        res.status(500).json({ error: 'Erro ao buscar faturamento diário consolidado', details: error.message });
    }
});

// Endpoint: Exportação Excel Consolidado Anual
router.get('/export/annual-consolidated', async (req, res) => {
    try {
        const statesParam = req.query.states;
        const year = req.query.year;
        const monthsParam = req.query.months;

        if (!statesParam || !year || !monthsParam) {
            return res.status(400).json({ error: 'Estados, Ano e Meses são obrigatórios para a exportação.' });
        }

        const states = statesParam.split(',').map(s => s.trim().toUpperCase());
        const selectedMonths = monthsParam.split(',').map(Number).sort((a, b) => a - b);
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const currentYear = new Date().getFullYear();
        const divisor = (year < currentYear) ? 12 : (year > currentYear ? 1 : Math.max(1, new Date().getMonth() + 1));

        const workbook = new ExcelJS.Workbook();

        for (const uf of states) {
            try {
                const report = await AnnualConsolidatedService.buildAnnualConsolidatedReport(uf, { year });
                const sheet = workbook.addWorksheet(`Anual ${uf}`);

                // 1. Build Headers
                const headerRow1 = ['Marca'];
                const headerRow2 = ['']; // Marca spans 2 rows

                selectedMonths.forEach(m => {
                    const monthLabel = `${monthNames[m - 1]} / ${year}`;
                    headerRow1.push(monthLabel, '', '', '');
                    headerRow2.push('Fat. Líquido', 'Custo Repos.', 'Qtdd.', '% MG');
                });

                headerRow1.push('Total Geral', '', '', '');
                headerRow2.push('Fat. Líquido', 'Custo Repos.', 'Qtdd.', '% MG');

                headerRow1.push('Média Mensal', '', '', '');
                headerRow2.push('Fat. Líquido', 'Custo Repos.', 'Qtdd.', '% MG');

                sheet.addRow(headerRow1);
                sheet.addRow(headerRow2);

                // Merging and styling Header Row 1
                sheet.mergeCells('A1:A2');
                const h1 = sheet.getRow(1);
                h1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                h1.alignment = { horizontal: 'center', vertical: 'middle' };
                // A1 background (slate-800 equivalent)
                h1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

                let colStart = 2; // B
                selectedMonths.forEach(() => {
                    sheet.mergeCells(1, colStart, 1, colStart + 3);
                    const cell = h1.getCell(colStart);
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // slate-900
                    colStart += 4;
                });

                // Total Geral merge
                sheet.mergeCells(1, colStart, 1, colStart + 3);
                h1.getCell(colStart).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // slate-800
                colStart += 4;

                // Média Mensal merge
                sheet.mergeCells(1, colStart, 1, colStart + 3);
                h1.getCell(colStart).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } }; // indigo-700

                // Styling Header Row 2
                const h2 = sheet.getRow(2);
                h2.font = { bold: true };
                h2.alignment = { horizontal: 'right', vertical: 'middle' };

                // Base colors for Header 2
                let cIdx = 2;
                selectedMonths.forEach(() => {
                    for (let i = 0; i < 4; i++) {
                        h2.getCell(cIdx++).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; // slate-50
                    }
                });
                for (let i = 0; i < 4; i++) {
                    const cell = h2.getCell(cIdx++);
                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }; // slate-700
                }
                for (let i = 0; i < 4; i++) {
                    const cell = h2.getCell(cIdx++);
                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // indigo-600
                }

                // Make column A wider
                sheet.getColumn(1).width = 30;
                for (let i = 2; i <= headerRow2.length; i++) {
                    sheet.getColumn(i).width = 15;
                }

                const applyDataRow = (rowData, isBranch, isGrandTotal = false) => {
                    const r = [rowData.branch || rowData.brand || 'Total'];

                    selectedMonths.forEach(m => {
                        const metrics = rowData[`month_${m}`];
                        r.push(metrics.revenue, metrics.cost, metrics.qty, metrics.margin);
                    });

                    r.push(rowData.total.revenue, rowData.total.cost, rowData.total.qty, rowData.total.margin);
                    r.push(rowData.total.revenue / divisor, rowData.total.cost / divisor, rowData.total.qty / divisor, rowData.total.margin);

                    const addedRow = sheet.addRow(r);

                    if (isGrandTotal) {
                        addedRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                        addedRow.eachCell((cell, colNumber) => {
                            if (colNumber === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
                            else cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // very dark
                        });
                    } else if (isBranch) {
                        addedRow.font = { bold: true };
                        addedRow.eachCell((cell, colNumber) => {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
                        });
                    } else {
                        // Brand row indent
                        addedRow.getCell(1).alignment = { indent: 2 };
                    }

                    // Number formats
                    let offset = 2; // B
                    selectedMonths.forEach(() => {
                        addedRow.getCell(offset++).numFmt = '"R$" #,##0.00;[Red]\-"R$" #,##0.00';
                        addedRow.getCell(offset).font = { color: { argb: 'FFF43F5E' }, bold: isBranch || isGrandTotal }; // Rose-500 for cost
                        addedRow.getCell(offset++).numFmt = '"R$" #,##0.00;[Red]\-"R$" #,##0.00';
                        addedRow.getCell(offset++).numFmt = '#,##0.##';
                        addedRow.getCell(offset).font = { color: { argb: 'FF10B981' }, bold: isBranch || isGrandTotal }; // Emerald-500
                        addedRow.getCell(offset++).numFmt = '0.00%';
                    });

                    // Totals
                    addedRow.getCell(offset).font = { color: { argb: 'FF1D4ED8' }, bold: true }; // blue-700
                    addedRow.getCell(offset++).numFmt = '"R$" #,##0.00;[Red]\-"R$" #,##0.00';
                    addedRow.getCell(offset).font = { color: { argb: 'FFE11D48' }, bold: true }; // rose-600
                    addedRow.getCell(offset++).numFmt = '"R$" #,##0.00;[Red]\-"R$" #,##0.00';
                    addedRow.getCell(offset++).numFmt = '#,##0.##';
                    addedRow.getCell(offset).font = { color: { argb: 'FF059669' }, bold: true }; // emerald-600
                    addedRow.getCell(offset++).numFmt = '0.00%';

                    // Averages
                    addedRow.getCell(offset).font = { color: { argb: 'FF4338CA' }, bold: true }; // indigo-700
                    addedRow.getCell(offset++).numFmt = '"R$" #,##0.00;[Red]\-"R$" #,##0.00';
                    addedRow.getCell(offset).font = { color: { argb: 'FFF43F5E' }, bold: true }; // rose-500
                    addedRow.getCell(offset++).numFmt = '"R$" #,##0.00;[Red]\-"R$" #,##0.00';
                    addedRow.getCell(offset++).numFmt = '#,##0.##';
                    addedRow.getCell(offset).font = { color: { argb: 'FF059669' }, bold: true }; // emerald-600
                    addedRow.getCell(offset++).numFmt = '0.00%';
                };

                // Populate Rows
                report.data.forEach(branch => {
                    applyDataRow(branch, true);
                    if (branch.brands) {
                        branch.brands.forEach(brand => applyDataRow(brand, false));
                    }
                });

                if (report.summary) {
                    applyDataRow(report.summary, true, true);
                }

            } catch (err) {
                console.error(`Erro processando aba ${uf} no export anual: `, err);
            }
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Anual_Consolidado_${year}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('[ReportsController] Erro ao exportar Excel Anual:', error);
        res.status(500).json({ error: 'Erro ao exportar relatório anual', details: error.message });
    }
}); // <-- Add the proper closing

// Endpoint: Exportação Excel Faturamento Diário Resumido
router.get('/export/daily-billing', async (req, res) => {
    try {
        const statesParam = req.query.states;
        const year = req.query.year;
        const month = req.query.month;
        const startDay = parseInt(req.query.startDay, 10) || 1;
        const endDay = parseInt(req.query.endDay, 10) || 31;
        const reportType = req.query.reportType || 'vendedores'; // 'vendedores' or 'consolidado'
        const salesperson = req.query.salesperson || '';
        const branch = req.query.branch || '';

        if (!statesParam || !year || !month) {
            return res.status(400).json({ error: 'Estados, Ano e Mês são obrigatórios para a exportação diária.' });
        }

        const states = statesParam.split(',').map(s => s.trim().toUpperCase());
        const S = Math.max(1, startDay);
        const E = Math.max(S, endDay);
        const targetDays = [];
        for (let i = S; i <= E; i++) targetDays.push(i);

        const workbook = new ExcelJS.Workbook();
        const monthStr = month.toString().padStart(2, '0');

        for (const uf of states) {
            try {
                let report;
                if (reportType === 'consolidado') {
                    report = await DailyBillingConsolidatedService.buildDailyBillingConsolidatedReport(uf, { month, year, branch });
                } else {
                    report = await DailyBillingService.buildDailyBillingReport(uf, { month, year, salesperson, branch });
                }

                if (!report.data || report.data.length === 0) continue;

                const sheet = workbook.addWorksheet(`Fat ${uf}`);

                // Build Headers
                const headers = ['Filial'];
                if (reportType === 'vendedores') {
                    headers.push('Vendedor');
                } else {
                    headers.push('Marca'); // Though not strictly separate columns in UI, Excel often splits them out better or we indent. Wait, the UI uses one column for Filial/Marca nesting. Let's match UI carefully.
                }

                targetDays.forEach(d => {
                    headers.push(`${d.toString().padStart(2, '0')}/${monthStr}`);
                });
                headers.push('Total Mensal');

                // Adjust headers if we want to mimic the single-column visual hierarchy of "Consolidado"
                if (reportType === 'consolidado') {
                    headers[0] = 'Filial / Marca';
                    headers.splice(1, 1); // remove the explicit 'Marca' column we just conditionally added to match standard 1 column style
                }

                sheet.addRow(headers);
                const headerRow = sheet.getRow(1);
                headerRow.font = { bold: true };
                headerRow.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; // slate-50 UI header color loosely translated
                });
                sheet.getColumn(1).width = 25;
                if (reportType === 'vendedores') {
                    sheet.getColumn(2).width = 25;
                }

                // Col widths for days
                let dayColStart = reportType === 'vendedores' ? 3 : 2;
                for (let i = 0; i < targetDays.length; i++) {
                    sheet.getColumn(dayColStart + i).width = 15;
                    headerRow.getCell(dayColStart + i).alignment = { horizontal: 'right' };
                }
                sheet.getColumn(dayColStart + targetDays.length).width = 20; // Total
                headerRow.getCell(dayColStart + targetDays.length).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } }; // blue-50 
                headerRow.getCell(dayColStart + targetDays.length).alignment = { horizontal: 'right' };

                const formatRowAmounts = (addedRow) => {
                    for (let i = 0; i < targetDays.length; i++) {
                        const cell = addedRow.getCell(dayColStart + i);
                        cell.numFmt = '"R$" #,##0.00;[Red]\-"R$" #,##0.00';
                        if (cell.value === 0) cell.value = '-'; // Match UI dashboard "-" 
                    }
                    const totalCell = addedRow.getCell(dayColStart + targetDays.length);
                    totalCell.numFmt = '"R$" #,##0.00;[Red]\-"R$" #,##0.00';
                    totalCell.font = { bold: true, color: { argb: 'FF1D4ED8' } }; // blue-700
                    totalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } }; // blue-50/50 approx
                };

                if (reportType === 'vendedores') {
                    report.data.forEach(row => {
                        const r = [row.branch, row.salesperson];
                        targetDays.forEach(d => r.push(row[`day_${d}`] || 0));
                        r.push(row.total || 0);

                        const addedRow = sheet.addRow(r);
                        formatRowAmounts(addedRow);
                    });
                } else {
                    // Consolidado nested logic
                    report.data.forEach(branchObj => {
                        // Branch header
                        const rBranch = [branchObj.branch];
                        targetDays.forEach(d => rBranch.push(branchObj[`day_${d}`] || 0));
                        rBranch.push(branchObj.total || 0);

                        const bRow = sheet.addRow(rBranch);
                        bRow.font = { bold: true };
                        bRow.eachCell(c => {
                            if (!c.fill || c.fill.fgColor?.argb === '00000000') {
                                c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100
                            }
                        });
                        formatRowAmounts(bRow);

                        // Brands under branch
                        if (branchObj.brands) {
                            branchObj.brands.forEach(brandObj => {
                                const rBrand = [brandObj.brand];
                                targetDays.forEach(d => rBrand.push(brandObj[`day_${d}`] || 0));
                                rBrand.push(brandObj.total || 0);

                                const brRow = sheet.addRow(rBrand);
                                brRow.getCell(1).alignment = { indent: 2 };
                                formatRowAmounts(brRow);
                            });
                        }
                    });
                }

                // Add Summary Line
                if (report.summary) {
                    const rSum = ['TOTAL'];
                    if (reportType === 'vendedores') rSum.push('-');
                    targetDays.forEach(d => rSum.push(report.summary[`day_${d}`] || 0));
                    rSum.push(report.summary.total || 0);

                    const sRow = sheet.addRow(rSum);
                    sRow.font = { bold: true, color: { argb: 'FF334155' } };
                    sRow.eachCell((c, cNum) => {
                        const isTotalCol = cNum === (dayColStart + targetDays.length);
                        if (!isTotalCol) {
                            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // slate-100/800
                        }
                    });
                    formatRowAmounts(sRow);
                }

            } catch (err) {
                console.error(`Erro processando aba ${uf} no export diario: `, err);
            }
        }

        if (workbook.worksheets.length === 0) {
            const infoSheet = workbook.addWorksheet('Aviso');
            infoSheet.addRow(['Nenhum dado encontrado para os filtros informados.']);
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Relatorio_Faturamento_Diario_${monthStr}_${year}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('[ReportsController] Erro ao exportar Excel Diário:', error);
        res.status(500).json({ error: 'Erro ao exportar relatório diário', details: error.message });
    }
});

// Endpoint: Relatório Consolidado Anual
router.get('/:state/annual-consolidated', async (req, res) => {
    try {
        const state = req.params.state?.toUpperCase();
        if (!state || state.length !== 2) {
            return res.status(400).json({ error: 'Estado (UF) inválido.' });
        }

        const { year } = req.query;
        if (!year) {
            return res.status(400).json({ error: 'Ano é um filtro obrigatório.' });
        }

        const report = await AnnualConsolidatedService.buildAnnualConsolidatedReport(state, { year });

        res.json(report);
    } catch (error) {
        console.error('[ReportsController] Erro ao buscar relatório consolidado anual:', error);
        res.status(500).json({ error: 'Erro ao buscar relatório consolidado anual', details: error.message });
    }
});

export default router;



