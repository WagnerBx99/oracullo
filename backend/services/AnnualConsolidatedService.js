import DataSourceService from './DataSourceService.js';

class AnnualConsolidatedService {
    /**
     * Builds the annual consolidated view for a given year.
     * Groups raw sales transactions by Branch and then by Brand.
     * Calculates Revenue, Cost, Quantity, and Margin % for each month (1-12) and total.
     */
    async buildAnnualConsolidatedReport(state, filters) {
        // Fetch raw data using the existing service
        // Expects filters.year to be passed
        const data = await DataSourceService.getSales(state, filters);
        const transactions = data.transactions;
        const year = parseInt(filters.year);

        if (!year) throw new Error("Year filter is required for Annual Consolidated Report");

        // Structure:
        // { 
        //   "BranchName": { 
        //      branch: "BranchName", 
        //      months: { "1": { revenue: 0, cost: 0, qty: 0, margin: 0 }, ... }, 
        //      total: { revenue: 0, cost: 0, qty: 0, margin: 0 },
        //      brands: {
        //          "BrandName": { 
        //              brand: "BrandName", 
        //              months: { "1": { revenue: 0, cost: 0, qty: 0, margin: 0 }, ... }, 
        //              total: { revenue: 0, cost: 0, qty: 0, margin: 0 } 
        //          }
        //      }
        //   } 
        // }
        const grouped = {};

        const initMetrics = () => ({ revenue: 0, cost: 0, qty: 0, margin: 0 });

        const initMonths = () => {
            const months = {};
            for (let i = 1; i <= 12; i++) {
                months[i] = initMetrics();
            }
            return months;
        };

        transactions.forEach(t => {
            const branch = t.branch || 'Sem Filial';
            const brand = t.brand || 'Sem Marca';

            if (!grouped[branch]) {
                grouped[branch] = {
                    branch,
                    months: initMonths(),
                    total: initMetrics(),
                    brands: {}
                };
            }

            if (!grouped[branch].brands[brand]) {
                grouped[branch].brands[brand] = {
                    brand,
                    months: initMonths(),
                    total: initMetrics()
                };
            }

            // Extract the month from the sale_date or ref_month (prefer ref_month if accurate based on query)
            let month = parseInt(t.ref_month);

            if (isNaN(month) && t.sale_date) {
                if (t.sale_date instanceof Date) {
                    month = t.sale_date.getUTCMonth() + 1;
                } else if (typeof t.sale_date === 'string') {
                    const dateObj = new Date(t.sale_date);
                    month = dateObj.getUTCMonth() + 1;
                }
            }

            if (month >= 1 && month <= 12) {
                const revenue = Number(t.total_sale_raw) || 0;
                const qty = Number(t.quantity) || 0;
                const unitCost = Number(t.unit_cost) || 0;
                const cost = qty * unitCost;

                const b = grouped[branch];
                const bd = grouped[branch].brands[brand];

                // Add to Branch month
                b.months[month].revenue += revenue;
                b.months[month].qty += qty;
                b.months[month].cost += cost;

                // Add to Branch total
                b.total.revenue += revenue;
                b.total.qty += qty;
                b.total.cost += cost;

                // Add to Brand month
                bd.months[month].revenue += revenue;
                bd.months[month].qty += qty;
                bd.months[month].cost += cost;

                // Add to Brand total
                bd.total.revenue += revenue;
                bd.total.qty += qty;
                bd.total.cost += cost;
            }
        });

        const calculateMargin = (metrics) => {
            if (metrics.revenue === 0) return 0;
            return ((metrics.revenue - metrics.cost) / metrics.revenue);
        };

        // Convert the map to the final structured array and calculate margins
        const rows = Object.values(grouped).map(branchRow => {

            const branchTotalMg = calculateMargin(branchRow.total);
            const flatBranch = {
                branch: branchRow.branch,
                isBranch: true,
                total: {
                    revenue: Number(branchRow.total.revenue.toFixed(2)),
                    cost: Number(branchRow.total.cost.toFixed(2)),
                    qty: Number(branchRow.total.qty.toFixed(2)),
                    margin: Number(branchTotalMg.toFixed(5))
                },
                brands: Object.values(branchRow.brands).map(brandRow => {
                    const brandTotalMg = calculateMargin(brandRow.total);
                    const flatBrand = {
                        brand: brandRow.brand,
                        isBrand: true,
                        total: {
                            revenue: Number(brandRow.total.revenue.toFixed(2)),
                            cost: Number(brandRow.total.cost.toFixed(2)),
                            qty: Number(brandRow.total.qty.toFixed(2)),
                            margin: Number(brandTotalMg.toFixed(5))
                        }
                    };
                    for (let i = 1; i <= 12; i++) {
                        const m = brandRow.months[i];
                        const mg = calculateMargin(m);
                        flatBrand[`month_${i}`] = {
                            revenue: Number(m.revenue.toFixed(2)),
                            cost: Number(m.cost.toFixed(2)),
                            qty: Number(m.qty.toFixed(2)),
                            margin: Number(mg.toFixed(5))
                        };
                    }
                    return flatBrand;
                }).sort((a, b) => a.brand.localeCompare(b.brand))
            };

            for (let i = 1; i <= 12; i++) {
                const m = branchRow.months[i];
                const mg = calculateMargin(m);
                flatBranch[`month_${i}`] = {
                    revenue: Number(m.revenue.toFixed(2)),
                    cost: Number(m.cost.toFixed(2)),
                    qty: Number(m.qty.toFixed(2)),
                    margin: Number(mg.toFixed(5))
                };
            }

            return flatBranch;
        });

        // Sort branches alphabetically
        rows.sort((a, b) => a.branch.localeCompare(b.branch));

        // Calculate Grand Totals row
        const grandTotal = {
            branch: 'Faturamento Total:',
            total: initMetrics()
        };
        for (let i = 1; i <= 12; i++) grandTotal[`month_${i}`] = initMetrics();

        rows.forEach(r => {
            grandTotal.total.revenue += r.total.revenue;
            grandTotal.total.cost += r.total.cost;
            grandTotal.total.qty += r.total.qty;

            for (let i = 1; i <= 12; i++) {
                grandTotal[`month_${i}`].revenue += r[`month_${i}`].revenue;
                grandTotal[`month_${i}`].cost += r[`month_${i}`].cost;
                grandTotal[`month_${i}`].qty += r[`month_${i}`].qty;
            }
        });

        // Format grand totals and margins
        grandTotal.total.margin = Number(calculateMargin(grandTotal.total).toFixed(5));
        grandTotal.total.revenue = Number(grandTotal.total.revenue.toFixed(2));
        grandTotal.total.cost = Number(grandTotal.total.cost.toFixed(2));
        grandTotal.total.qty = Number(grandTotal.total.qty.toFixed(2));

        for (let i = 1; i <= 12; i++) {
            grandTotal[`month_${i}`].margin = Number(calculateMargin(grandTotal[`month_${i}`]).toFixed(5));
            grandTotal[`month_${i}`].revenue = Number(grandTotal[`month_${i}`].revenue.toFixed(2));
            grandTotal[`month_${i}`].cost = Number(grandTotal[`month_${i}`].cost.toFixed(2));
            grandTotal[`month_${i}`].qty = Number(grandTotal[`month_${i}`].qty.toFixed(2));
        }

        return {
            metadata: {
                year
            },
            data: rows,
            summary: grandTotal
        };
    }
}

export default new AnnualConsolidatedService();
