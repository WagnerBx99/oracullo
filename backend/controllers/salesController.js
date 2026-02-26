import { poolAnalitico } from '../config/databases.js';

export const updateSaleCommission = async (req, res) => {
    try {
        const { id } = req.params;
        const { salesperson_comm_pct } = req.body;

        if (salesperson_comm_pct === undefined || isNaN(salesperson_comm_pct)) {
            return res.status(400).json({ error: 'Percentual de comissão inválido ou ausente.' });
        }

        // 1. Obter a transação atual para saber o valor da venda
        const fetchRes = await poolAnalitico.query(`
            SELECT id, total_sale_raw, unit_price, quantity 
            FROM sales_transactions 
            WHERE id = $1
        `, [id]);

        if (fetchRes.rowCount === 0) {
            return res.status(404).json({ error: 'Transação não encontrada.' });
        }

        const tx = fetchRes.rows[0];

        // 2. Determinar a Base de Cálculo (priorizando o Total da Planilha se existir)
        const baseSale = tx.total_sale_raw !== null ? Number(tx.total_sale_raw) : (Number(tx.unit_price) * Number(tx.quantity));

        // 3. Recalcular o R$
        const newCommPct = Number(salesperson_comm_pct);
        const newCommRs = baseSale * newCommPct;

        // 4. Salvar no banco
        const updateRes = await poolAnalitico.query(`
            UPDATE sales_transactions 
            SET 
                salesperson_comm_pct = $1,
                salesperson_comm_rs = $2
            WHERE id = $3
            RETURNING salesperson_comm_pct, salesperson_comm_rs
        `, [newCommPct, newCommRs, id]);

        return res.json({
            message: 'Comissão atualizada com sucesso',
            data: updateRes.rows[0]
        });

    } catch (error) {
        console.error('[UpdateCommission] Erro interno:', error);
        return res.status(500).json({ error: 'Falha ao atualizar a comissão.', details: error.message });
    }
};

export const updateUnitCost = async (req, res) => {
    try {
        const { id } = req.params;
        const { unit_cost } = req.body;

        if (unit_cost === undefined || isNaN(unit_cost)) {
            return res.status(400).json({ error: 'Valor de custo unitário inválido ou ausente.' });
        }

        // Obtém a quantidade para possível recálculo, embora o total_cost não seja persistido na view dependendo da modelagem.
        // Custo Unitário na nossa spec não atualiza outras colunas nativas do BD base (só unit_cost mesmo),
        // pois total_cost e margens são recalculadas na camada de `calculateSalesRow.js` no momento do GET.
        const newUnitCost = Number(unit_cost);

        const updateRes = await poolAnalitico.query(`
            UPDATE sales_transactions 
            SET unit_cost = $1
            WHERE id = $2
            RETURNING unit_cost
        `, [newUnitCost, id]);

        if (updateRes.rowCount === 0) {
            return res.status(404).json({ error: 'Transação não encontrada.' });
        }

        return res.json({
            message: 'Custo unitário atualizado com sucesso',
            data: updateRes.rows[0]
        });

    } catch (error) {
        console.error('[UpdateUnitCost] Erro interno:', error);
        return res.status(500).json({ error: 'Falha ao atualizar o custo unitário.', details: error.message });
    }
};

export const updateCheckColumn = async (req, res) => {
    try {
        const { id } = req.params;
        const { check_column } = req.body;

        if (check_column === undefined) {
            return res.status(400).json({ error: 'Valor de conferência ausente.' });
        }

        const updateRes = await poolAnalitico.query(`
            UPDATE sales_transactions 
            SET check_column = $1
            WHERE id = $2
            RETURNING check_column
        `, [check_column, id]);

        if (updateRes.rowCount === 0) {
            return res.status(404).json({ error: 'Transação não encontrada.' });
        }

        return res.json({
            message: 'Conferência atualizada com sucesso',
            data: updateRes.rows[0]
        });

    } catch (error) {
        console.error('[UpdateCheckColumn] Erro interno:', error);
        return res.status(500).json({ error: 'Falha ao atualizar a conferência.', details: error.message });
    }
};
