import * as xlsx from 'xlsx';
import fs from 'fs';

const filePath = '/Users/cason/Projects/cason_oracullo/reports/2. Faturamento - 2025 - Paraná.xlsx';
const buf = fs.readFileSync(filePath);
const workbook = xlsx.read(buf, { type: 'buffer' });
const sheetBase = workbook.Sheets['Base'];

if (sheetBase) {
    const dataBase = xlsx.utils.sheet_to_json(sheetBase, { header: 1, range: 2 });
    for (let i = 0; i < 5; i++) {
        const row = dataBase[i];
        if (row) {
             const brand = row[13]; // coluna N
             const commV = row[14]; // coluna O
             const commI = row[15];  // coluna P
             console.log(`Brand: ${brand}, CommV: ${commV}, CommI: ${commI}`);
        }
    }
} else {
    console.log("Sheet 'Base' not found.");
}
