import dailyBillingService from './services/DailyBillingService.js';
import { testConnections } from './config/databases.js';

async function run() {
    await testConnections();
    console.log("Testing Daily Billing Aggregation...");
    try {
        const result = await dailyBillingService.buildDailyBillingReport('SC', { month: 1, year: 2025 });
        console.log("Metadata:", result.metadata);
        console.log("First 2 rows:", result.data.slice(0, 2));
        console.log("Summary:", result.summary);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
