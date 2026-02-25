/**
 * @typedef {Object} BrandRow
 * @property {string} brand Nome da marca (ou 'TOTAL').
 * @property {number|null} rank Porcentagem (0.00 a 1.00) do faturamento da secao, null se for TOTAL.
 * @property {number} revenue
 * @property {number} cost
 * @property {number} liters_qty
 * @property {number} avg_ticket
 * @property {number} gross_margin
 * @property {number} operational_cost_pct
 * @property {number} operational_cost_rs
 * @property {number} net_margin_pct
 * @property {number} net_profitability
 * @property {number} salesperson_comm_pct
 * @property {number} salesperson_comm_rs
 * @property {number} internal_comm_pct
 * @property {number} internal_comm_rs
 * @property {number} [manager_comm_pct] Apenas em Consolidated General
 * @property {number} [manager_comm_rs] Apenas em Consolidated General
 */

/**
 * @typedef {Object} SalespersonSection
 * @property {string} salesperson
 * @property {BrandRow[]} brands
 */

/**
 * @typedef {Object} BranchSection
 * @property {string} branch
 * @property {BrandRow[]} brands
 */

/**
 * @typedef {Object} ConsolidatedSection
 * @property {BrandRow[]} brands
 */

/**
 * @typedef {Object} ConsolidatedReportResponse
 * @property {SalespersonSection[]} by_salesperson
 * @property {BranchSection[]} by_branch
 * @property {ConsolidatedSection} consolidated
 */

module.exports = {};
