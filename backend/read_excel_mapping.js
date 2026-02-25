import ExcelJS from 'exceljs';

async function run() {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('./reports/6.Faturamento - 2026 - São Paulo - Copia.xlsx');
        const ws = workbook.getWorksheet('Jan 25 A');

        console.log("== Localizando as tabelas em Jan 25 A ==");
        ws.eachRow((row, rowNumber) => {
            const c3 = row.getCell(3).value; // Col C is Marca/Person/Title
            const c4 = row.getCell(4).value; // Col D
            const c5 = row.getCell(5).value; // Col E
            if (c3 || c4 || c5) {
                console.log(`[Row ${rowNumber}] C: ${c3 || ''} | D: ${c4 || ''} | E: ${c5?.result || c5 || ''}`);
            }
        });
    } catch (e) {
        console.error(e);
    }
}
run();
