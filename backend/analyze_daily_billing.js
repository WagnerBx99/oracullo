import ExcelJS from 'exceljs';

async function run() {
    try {
        const filePath = '/Users/cason/Projects/cason_oracullo/reports/8. Faturamento Diário Resumido - 2025 - Copia.xlsx';
        const workbook = new ExcelJS.Workbook();
        console.log("Loading workbook...");
        await workbook.xlsx.readFile(filePath);

        console.log("Worksheets:");
        workbook.worksheets.forEach(ws => {
            console.log(`- ${ws.name} (Rows: ${ws.rowCount})`);
        });

        for (const ws of workbook.worksheets) {
            console.log(`\n=== Sheet: ${ws.name} ===`);
            for (let i = 1; i <= 30; i++) {
                const row = ws.getRow(i);
                if (!row.hasValues) continue;

                const vals = [];
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    if (!cell) return;
                    let val = cell.value;
                    let isFormula = false;
                    if (val && typeof val === 'object' && val.formula) {
                        val = val.result !== undefined ? val.result : '(formula)';
                        isFormula = true;
                    } else if (val && typeof val === 'object' && val.sharedFormula) {
                        val = val.result !== undefined ? val.result : '(shared formula)';
                        isFormula = true;
                    }

                    if (val !== null && val !== undefined && val !== '') {
                        if (val instanceof Date) {
                            val = val.toISOString().split('T')[0];
                        }
                        vals.push(`[Col ${colNumber}] ${isFormula ? 'ƒ(' : ''}${val}${isFormula ? ')' : ''}`);
                    }
                });
                if (vals.length > 0) {
                    console.log(`Row ${i}:`, vals.join(' | '));
                }
            }
        }

    } catch (e) {
        console.error(e);
    }
}
run();
