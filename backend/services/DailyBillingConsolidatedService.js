import DataSourceService from './DataSourceService.js';

class DailyBillingConsolidatedService {
    /**
     * Builds the consolidated daily billing view for a given month and year.
     * Groups raw sales transactions by Branch and then by Brand.
     * Calculates sum(total_sale_raw) for each day of the month (1-31).
     */
    async buildDailyBillingConsolidatedReport(state, filters) {
        // Fetch raw data using the existing service
        const data = await DataSourceService.getSales(state, filters);
        const transactions = data.transactions;

        // Determine how many days in this month
        const year = parseInt(filters.year);
        const month = parseInt(filters.month);
        const daysInMonth = new Date(year, month, 0).getDate();

        // Grouping Structure:
        // { 
        //   "BranchName": { 
        //      branch: "BranchName", 
        //      days: { "1": 0, ... }, 
        //      total: 0,
        //      brands: {
        //          "BrandName": { brand: "BrandName", days: { "1": 0, ... }, total: 0 }
        //      }
        //   } 
        // }
        const grouped = {};

        transactions.forEach(t => {
            const branch = t.branch || 'Sem Filial';
            const brand = t.brand || 'Sem Marca';

            if (!grouped[branch]) {
                const defaultDays = {};
                for (let i = 1; i <= 31; i++) defaultDays[i] = 0;

                grouped[branch] = {
                    branch,
                    days: defaultDays,
                    total: 0,
                    brands: {}
                };
            }

            if (!grouped[branch].brands[brand]) {
                const defaultDays = {};
                for (let i = 1; i <= 31; i++) defaultDays[i] = 0;

                grouped[branch].brands[brand] = {
                    brand,
                    days: defaultDays,
                    total: 0
                };
            }

            // Extract the day from the sale_date
            let day = null;
            if (t.sale_date instanceof Date) {
                day = t.sale_date.getUTCDate();
            } else if (typeof t.sale_date === 'string') {
                const dateObj = new Date(t.sale_date);
                day = dateObj.getUTCDate();
            }

            if (day >= 1 && day <= 31) {
                const saleAmount = Number(t.total_sale_raw) || 0;

                // Add to Branch total
                grouped[branch].days[day] += saleAmount;
                grouped[branch].total += saleAmount;

                // Add to Brand total
                grouped[branch].brands[brand].days[day] += saleAmount;
                grouped[branch].brands[brand].total += saleAmount;
            }
        });

        // Convert the map to the final structured array
        const rows = Object.values(grouped).map(branchRow => {
            const flatBranch = {
                branch: branchRow.branch,
                isBranch: true,
                total: Number(branchRow.total.toFixed(2)),
                brands: Object.values(branchRow.brands).map(brandRow => {
                    const flatBrand = {
                        brand: brandRow.brand,
                        isBrand: true,
                        total: Number(brandRow.total.toFixed(2))
                    };
                    for (let i = 1; i <= 31; i++) {
                        flatBrand[`day_${i}`] = Number(brandRow.days[i].toFixed(2));
                    }
                    return flatBrand;
                }).sort((a, b) => a.brand.localeCompare(b.brand))
            };

            for (let i = 1; i <= 31; i++) {
                flatBranch[`day_${i}`] = Number(branchRow.days[i].toFixed(2));
            }

            return flatBranch;
        });

        // Sort branches alphabetically
        rows.sort((a, b) => a.branch.localeCompare(b.branch));

        // Calculate Grand Totals row
        const grandTotal = {
            branch: 'Total:',
            total: 0
        };
        for (let i = 1; i <= 31; i++) grandTotal[`day_${i}`] = 0;

        rows.forEach(r => {
            grandTotal.total += r.total;
            for (let i = 1; i <= 31; i++) {
                grandTotal[`day_${i}`] += r[`day_${i}`];
            }
        });

        // Format grand totals to 2 decimal places
        grandTotal.total = Number(grandTotal.total.toFixed(2));
        for (let i = 1; i <= 31; i++) {
            grandTotal[`day_${i}`] = Number(grandTotal[`day_${i}`].toFixed(2));
        }

        return {
            metadata: {
                year,
                month,
                daysInMonth
            },
            data: rows,
            summary: grandTotal
        };
    }
}

export default new DailyBillingConsolidatedService();
