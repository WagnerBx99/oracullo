import ExcelJS from 'exceljs';

async function analyze() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('/Users/cason/Projects/cason_oracullo/reports/8. Faturamento Diário Resumido - 2025 - Copia.xlsx');
    
    const sheet = workbook.getWorksheet('Jan 25');
    
    // We are looking for how branches and brands relate. 
    // In many spreadsheets, it's a hierarchy: Row X has Branch name in Col C, Row X+1 has Brand in Col D, etc.
    let currentBranch = null;
    
    for (let i = 4; i <= 60; i++) {
        const row = sheet.getRow(i);
        const colC = row.getCell(3).text ? row.getCell(3).text.trim() : '';
        const colD = row.getCell(4).text ? row.getCell(4).text.trim() : '';
        const colE = row.getCell(5).text ? row.getCell(5).text.trim() : '';
        
        // Col D seems to have the Branch names (e.g. Blumenau) and sometimes Brands (e.g. Kendall)
        // Col E seems to have the Salesperson or Brand name too. Let's trace C, D, E
        
        let rowStr = `Row ${i}: `;
        if (colC) rowStr += `[C] ${colC} | `;
        if (colD) rowStr += `[D] ${colD} | `;
        if (colE) rowStr += `[E] ${colE} | `;
        
        if (colC || colD || colE) {
            console.log(rowStr);
        }
    }
}

analyze().catch(console.error);
