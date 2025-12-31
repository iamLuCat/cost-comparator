
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.resolve('./FileA.xlsx');

try {
    if (!fs.existsSync(FILE_PATH)) {
        console.error("File not found at:", FILE_PATH);
        process.exit(1);
    }
    const buffer = fs.readFileSync(FILE_PATH);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    console.log("Workbook Sheets:", workbook.SheetNames);

    workbook.SheetNames.forEach((sheetName: string) => {
        const sheet = workbook.Sheets[sheetName];
        console.log(`\n--- Sheet: ${sheetName} ---`);

        // Dump first 20 rows to see header structure
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: '' }).slice(0, 20);

        json.forEach((row: any, idx: number) => {
            // Filter empty cells for cleaner output
            const compactRow = (row as any[]).map((c, i) => c ? `[${i}]${c}` : '').filter(c => c);
            if (compactRow.length > 0) {
                console.log(`Row ${idx}:`, compactRow.join(" | "));
            }
        });
    });

} catch (e) {
    console.error("Error reading file:", e);
}
