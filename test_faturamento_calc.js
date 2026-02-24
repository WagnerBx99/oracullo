import { calculateSalesRow } from './backend/services/calculateSalesRow.js';
import assert from 'assert';

console.log('Iniciando testes...');

// Cenário 1: Configuração Completa
const tx1 = {
    id: '123',
    state: 'SP',
    unit_price: 100.00,
    quantity: 2,
    unit_cost: 40.00,
    liters_qty: 1
};

const config1 = {
    operational_cost_pct: 0.10, // 10%
    salesperson_comm_pct: 0.05, // 5%
    internal_comm_pct: 0.01     // 1%
};

const result1 = calculateSalesRow(tx1, config1);

assert.strictEqual(result1.computed.totalSalesValue, 200, 'Total Sales 1');
assert.strictEqual(result1.computed.totalCostValue, 80, 'Total Cost 1');
assert.strictEqual(result1.computed.totalOperationalCost, 20, 'Op Cost 1');
assert.strictEqual(result1.computed.totalSalespersonComm, 10, 'Sales Comm 1');
assert.strictEqual(result1.computed.totalInternalComm, 2, 'Internal Comm 1');

// Lucro: 200 - (80 + 20 + 10 + 2) = 200 - 112 = 88
assert.strictEqual(result1.computed.profit, 88, 'Profit 1');
assert.strictEqual(result1.computed.marginPct, 88 / 200, 'Margin Pct 1');

// Cenário 2: Sem Configuração de Marca (Fallback seguro)
const result2 = calculateSalesRow(tx1, null);
assert.strictEqual(result2.computed.totalOperationalCost, 0, 'Op Cost fallback');
assert.strictEqual(result2.computed.profit, 120, 'Profit fallback: 200 - 80');

console.log('✅ Todos os testes isolados de calculateSalesRow passaram com sucesso.');
