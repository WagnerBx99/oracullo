import * as xlsx from 'xlsx';
import fs from 'fs';

const filePath = '/Users/cason/Projects/cason_oracullo/reports/2. Faturamento - 2025 - Paraná.xlsx';
const buf = fs.readFileSync(filePath);
const workbook = xlsx.read(buf, { type: 'buffer' });
const firstBSheet = workbook.SheetNames.find(n => n.trim().endsWith(' B'));

if (firstBSheet) {
    console.log(`Checking ${firstBSheet}...`);
    const dataSalesForConfig = xlsx.utils.sheet_to_json(workbook.Sheets[firstBSheet], { header: 1, range: 3 });
    for (let i = 0; i < Math.min(5, dataSalesForConfig.length); i++) {
        const row = dataSalesForConfig[i];
        if (row) {
            const brand = row[3];
            const tempOpCost = row[23]; // coluna X
            console.log(`Brand: ${brand}, Col X (23): ${tempOpCost}`);
        }
    }
}
