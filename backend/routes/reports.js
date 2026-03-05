import express from 'express';
import dataSourceService from '../services/DataSourceService.js';
import ConsolidatedReportService from '../services/consolidated-report.service.js';

const router = express.Router();

const parseState = (rawParam) => {
    if (!rawParam || rawParam === 'all') return ['all'];
    return rawParam.includes(',') ? rawParam.split(',') : [rawParam];
};

// Endpoint: Unidades
router.get('/states', async (req, res) => {
    try {
        const states = await dataSourceService.getAvailableStates();
        res.json(states);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar unidades' });
    }
});

// Endpoint: Filtros
router.get('/:state/sales/filters', async (req, res) => {
    try {
        const state = parseState(req.params.state);
        const filters = await dataSourceService.getFiltersOptions(state);
        res.json(filters);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar filtros' });
    }
});

// Endpoint: Vendas (Corrigido para usar getSales)
router.get('/:state/sales', async (req, res) => {
    try {
        const state = parseState(req.params.state);
        const { month, year, salesperson, branch, page, page_size } = req.query;
        const report = await dataSourceService.getSales(state, {
            month, year, salesperson, branch, page, page_size
        });
        res.json(report);
    } catch (error) {
        console.error('Erro na rota /sales:', error);
        res.status(500).json({ error: 'Erro ao buscar relatório de vendas' });
    }
});

// Endpoint: Consolidado
router.get('/:state/consolidated', async (req, res) => {
    try {
        const state = parseState(req.params.state);
        const { month, year } = req.query;
        const report = await ConsolidatedReportService.buildConsolidatedReport(state, { month, year });
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar consolidado' });
    }
});

// Endpoint: Faturamento Diário
router.get('/:state/daily-billing', async (req, res) => {
    try {
        const state = parseState(req.params.state);
        const { month, year } = req.query;
        const report = await dataSourceService.getDailyBilling(state, { month, year });
        res.json(report);
    } catch (error) {
        console.error('Erro na rota /daily-billing:', error);
        res.status(500).json({ error: 'Erro ao buscar faturamento diário' });
    }
});

export default router;
