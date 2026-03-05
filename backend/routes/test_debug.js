import express from 'express';
import dataSourceService from '../services/DataSourceService.js';
const router = express.Router();

router.get('/debug-sales', async (req, res) => {
    try {
        const report = await dataSourceService.getSales(['all'], { month: 2, year: 2026 });
        res.json({ success: true, count: report.transactions.length, data: report.transactions.slice(0, 5) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
