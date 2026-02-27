import pkg from 'xlsx';
const { readFile, utils } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../reports/9. Consolidado de Vendas - 2026 - PECMOTORS.xlsx');

try {
    const workbook = readFile(filePath);
    const sheet = workbook.Sheets['Fechamento 2026'];
    const data = utils.sheet_to_json(sheet, { header: 1 });

    console.log("Analyzing Fechamento 2026 structure...");
    data.forEach((row, idx) => {
        // Just print the first 3 columns to see headers, branch names, and brand names
        if (row[0] || row[1] || row[2]) {
            console.log(`Row ${idx + 1}: [0]=${row[0]} | [1]=${row[1]} | [2]=${row[2]}`);
        }
    });
} catch (e) {
    console.error("Error parsing Excel:", e.stack);
}
