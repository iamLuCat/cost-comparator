const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const FILE_PATH = path.resolve('./FileA.xlsx');

const KNOWN_KEYWORDS = [
    'stt', 'so cont', 'cont', 'container', 'ngay', 'date', 'bill', 'so bill',
    'chi phi', 'cost', 'tien', 'amount', 'thanh tien',
    'ha', 'nang', 'lift', 'phi', 'cuoc', 'kho', 'xe', 'bot', 'thue', 'vat', 'neo'
];

const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function findHeaderRowIndex(sheet, limit = 20) {
    const range = XLSX.utils.decode_range(sheet['!ref'] || "A1");
    const endRow = Math.min(range.e.r, limit);

    let bestRow = 0;
    let maxScore = 0;

    for (let R = 0; R <= endRow; R++) {
        let score = 0;
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = sheet[cellRef];
            if (!cell || !cell.v) continue;

            const val = String(cell.v);
            const normVal = normalize(val);
            if (KNOWN_KEYWORDS.some(k => normVal.includes(k))) {
                score++;
            }
        }
        if (score > maxScore) {
            maxScore = score;
            bestRow = R;
        }
    }
    return bestRow;
}

try {
    if (!fs.existsSync(FILE_PATH)) {
        console.error("File not found at:", FILE_PATH);
        process.exit(1);
    }
    const buffer = fs.readFileSync(FILE_PATH);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    console.log(`Processing ${FILE_PATH}...`);

    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n>>> SHEET: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        const bestRow = findHeaderRowIndex(worksheet);
        console.log(`Detected Main Header Row Index: ${bestRow}`);

        const fetchOptions = { header: 1, range: bestRow, defval: '' };
        const rawData = XLSX.utils.sheet_to_json(worksheet, fetchOptions);

        if (rawData.length < 2) {
            console.log("Not enough rows for merge logic.");
            return;
        }

        const primaryHeaderRow = rawData[0];
        const secondaryHeaderRow = rawData[1] || [];

        // Check if secondary row has keywords
        let valid = 0;
        secondaryHeaderRow.forEach(c => {
            const val = normalize(String(c || ''));
            if (KNOWN_KEYWORDS.some(k => val.includes(k))) valid++;
        });
        const looksLikeDoubleHeader = valid > 0;
        console.log(`Looks like double header? ${looksLikeDoubleHeader} (Keywords found in secondary: ${valid})`);

        let headers = [];
        if (looksLikeDoubleHeader) {
            const maxLen = Math.max(primaryHeaderRow.length, secondaryHeaderRow.length);
            for (let i = 0; i < maxLen; i++) {
                const top = String(primaryHeaderRow[i] || '').trim();
                const bottom = String(secondaryHeaderRow[i] || '').trim();

                let merged = top;
                if (bottom) {
                    merged = top ? `${top} ${bottom}` : bottom;
                }
                headers.push(merged);
            }
            console.log("--- FINAL MERGED HEADERS ---");
        } else {
            headers = primaryHeaderRow.map(String);
            console.log("--- SINGLE HEADERS ---");
        }

        // Print with index
        headers.forEach((h, i) => {
            if (h) console.log(`[${i}] ${h}`);
        });
    });

} catch (e) {
    console.error("Error:", e);
}
