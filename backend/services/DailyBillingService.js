import DataSourceService from './DataSourceService.js';

class DailyBillingService {
    /**
     * Builds the consolidated daily billing view for a given month and year.
     * Groups raw sales transactions by Branch and Salesperson.
     * Calculates sum(total_sale_raw) for each day of the month (1-31).
     */
    async buildDailyBillingReport(state, filters) {
        // Fetch raw data using the existing service
        const data = await DataSourceService.getSales(state, filters);
        const transactions = data.transactions;

        // Determine how many days in this month
        // Just in case we need to know the bounds, though we can safely just map 1 to 31
        const year = parseInt(filters.year);
        const month = parseInt(filters.month);
        const daysInMonth = new Date(year, month, 0).getDate();

        // Grouping Structure:
        // { "BranchName|SalespersonName": { branch, salesperson, days: { "1": 0, "2": 0, ... "31": 0 }, total: 0 } }
        const grouped = {};

        transactions.forEach(t => {
            const branch = t.branch || 'Sem Filial';
            const salesperson = t.salesperson || 'Sem Vendedor';
            const key = `${branch}|${salesperson}`;

            if (!grouped[key]) {
                const defaultDays = {};
                for (let i = 1; i <= 31; i++) {
                    defaultDays[i] = 0;
                }
                grouped[key] = {
                    branch,
                    salesperson,
                    days: defaultDays,
                    total: 0
                };
            }

            // Extract the day from the sale_date
            // Expected format depends on DB, usually JS Date object or string "YYYY-MM-DD"
            let day = null;
            if (t.sale_date instanceof Date) {
                // Adjust for timezone issues if it's midnight UTC
                day = t.sale_date.getUTCDate();
            } else if (typeof t.sale_date === 'string') {
                // e.g., "2025-01-05T00:00:00.000Z"
                const dateObj = new Date(t.sale_date);
                day = dateObj.getUTCDate();
            }

            if (day >= 1 && day <= 31) {
                const saleAmount = Number(t.total_sale_raw) || 0;
                grouped[key].days[day] += saleAmount;
                grouped[key].total += saleAmount;
            }
        });

        // Convert the map to a flat array for the frontend
        const rows = Object.values(grouped).map(row => {
            // Flatten days into the object root for easier frontend table column access
            // e.g. { branch: 'A', salesperson: 'B', day_1: 100, day_2: 0, ..., total: 100 }
            const flatRow = {
                branch: row.branch,
                salesperson: row.salesperson,
                total: Number(row.total.toFixed(2))
            };

            for (let i = 1; i <= 31; i++) {
                flatRow[`day_${i}`] = Number(row.days[i].toFixed(2));
            }

            return flatRow;
        });

        // Sort rows by Branch then Salesperson
        rows.sort((a, b) => {
            if (a.branch < b.branch) return -1;
            if (a.branch > b.branch) return 1;
            if (a.salesperson < b.salesperson) return -1;
            if (a.salesperson > b.salesperson) return 1;
            return 0;
        });

        // Calculate Grand Totals row (optional but useful)
        const grandTotal = {
            branch: 'Total:',
            salesperson: 'Total:',
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

export default new DailyBillingService();
