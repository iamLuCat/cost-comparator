import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = '../FileA.xlsx';

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    console.log("File Read Success. Sheets found:", workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];
        console.log("Headers:", headers);

        // Peek data
        const data = XLSX.utils.sheet_to_json(sheet, { defval: '' }).slice(0, 3);
        console.log("Sample Data:", JSON.stringify(data, null, 2));
    });

} catch (e) {
    console.error("Error reading file:", e);
}
