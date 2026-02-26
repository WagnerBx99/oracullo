/**
 * Módulo puro (pure function) para calcular valores de uma linha de venda.
 * Pode ser testado de forma totalmente isolada.
 * Baseado na especificação de negócio do Banco B (Jan 25 B).
 * 
 * @param {Object} transaction - Os dados brutos da transação de venda.
 * @param {Object} brandConfig  - As configurações da marca daquele produto.
 * @returns {Object} - A linha processada com os cálculos requeridos pela especificação.
 */
export function calculateSalesRow(transaction, brandConfig) {
    if (!brandConfig) {
        throw new Error(`Configuração de marca ausente para '${transaction.brand}'. Configure os percentuais de custo e comissão na base de dados para proceder.`);
    }

    const config = {
        operational_cost_pct: brandConfig.operational_cost_pct,
        salesperson_comm_pct: brandConfig.salesperson_comm_pct ?? 0.01,
        internal_comm_pct: brandConfig.internal_comm_pct ?? 0.005
    };

    const quantity = Number(transaction.quantity) || 0;
    const unitPrice = Number(transaction.unit_price) || 0;
    const unitCost = Number(transaction.unit_cost) || 0;

    // Calculos base
    const totalCost = unitCost * quantity;
    const totalSale = typeof transaction.total_sale_raw !== 'undefined' && transaction.total_sale_raw !== null
        ? Number(transaction.total_sale_raw)
        : (unitPrice * quantity);

    const salespersonCommPct = typeof transaction.salesperson_comm_pct !== 'undefined' && transaction.salesperson_comm_pct !== null
        ? Number(transaction.salesperson_comm_pct)
        : Number(config.salesperson_comm_pct);

    const salespersonCommRs = typeof transaction.salesperson_comm_rs !== 'undefined' && transaction.salesperson_comm_rs !== null
        ? Number(transaction.salesperson_comm_rs)
        : totalSale * salespersonCommPct;

    const internalCommRs = totalSale * Number(config.internal_comm_pct);

    // Margem Bruta
    const grossMargin = totalSale > 0 ? (totalSale - totalCost) / totalSale : 0;

    // Custos Operacionais
    const operationalCostRs = totalSale * Number(config.operational_cost_pct);

    // Margem Liquida & Rentabilidade
    const netMarginPct = grossMargin - Number(config.operational_cost_pct);
    const netProfitability = totalSale * netMarginPct;

    return {
        id: transaction.id,
        product_code: transaction.product_code,
        sale_date: transaction.sale_date,
        brand: transaction.brand,
        subgroup: transaction.subgroup,
        invoice_number: transaction.invoice_number,
        client_name: transaction.client_name,
        branch: transaction.branch,
        salesperson: transaction.salesperson,
        payment_term: transaction.payment_term,
        product: transaction.product,
        unit_price: unitPrice,
        quantity: quantity,
        unit_cost: unitCost,
        ...transaction, // Pega outros campos nativos como liters_qty, ref_month, ref_year, packaging_type

        // Campos Adicionados/Sobrescritos pela Especificação de Resposta
        total_cost: totalCost,
        total_sale: totalSale,
        salesperson_comm_pct: salespersonCommPct,
        salesperson_comm_rs: salespersonCommRs,
        internal_comm_pct: Number(config.internal_comm_pct),
        internal_comm_rs: internalCommRs,
        gross_margin: grossMargin,
        check_column: unitCost, // Espelho do custo unitário
        operational_cost_pct: Number(config.operational_cost_pct),
        operational_cost_rs: operationalCostRs,
        net_margin_pct: netMarginPct,
        net_profitability: netProfitability
    };
}
