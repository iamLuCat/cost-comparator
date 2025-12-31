import * as XLSX from 'xlsx';
import type { FileData, SheetData, ExcelRow } from '../types';

// Simple normalizer for detection
const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const KNOWN_KEYWORDS = [
    'stt', 'so cont', 'cont', 'container', 'ngay', 'date', 'bill', 'so bill',
    'chi phi', 'cost', 'tien', 'amount', 'thanh tien',
    'ha', 'nang', 'lift', 'phi', 'cuoc', 'kho', 'xe', 'bot', 'thue', 'vat', 'neo'
];

const findHeaderRowIndex = (sheet: XLSX.WorkSheet, limit = 20): number => {
    const range = XLSX.utils.decode_range(sheet['!ref'] || "A1");
    // Limit check
    const endRow = Math.min(range.e.r, limit);

    let bestRow = 0;
    let maxScore = 0;

    for (let R = 0; R <= endRow; R++) {
        let score = 0;
        let nonEmptyCount = 0;

        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = sheet[cellRef];
            if (!cell || !cell.v) continue;

            const val = String(cell.v);
            nonEmptyCount++;

            const normVal = normalize(val);
            if (KNOWN_KEYWORDS.some(k => normVal.includes(k))) {
                score++;
            }
        }

        // Boost score if it looks like a header (many non-empty strings)
        // Adjust weight as needed
        if (score > maxScore) {
            maxScore = score;
            bestRow = R;
        }
    }

    // Fallback: If no keywords found, maybe pick the row with most columns?
    // For now, return best matched row.
    return bestRow;
};


export const parseExcelFile = (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                const sheets: SheetData[] = workbook.SheetNames.map(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];

                    // Smart Header Detection
                    const bestRow = findHeaderRowIndex(worksheet);


                    // Fetch enough rows to cover [header-1, header, data...]
                    // Refined Multi-row Header Strategy
                    let headers: string[] = [];
                    let dataRows: any[] = [];

                    // Helper to check if a row looks like a header (has keywords)
                    const hasKeywords = (row: any[]) => {
                        if (!row) return false;
                        let valid = 0;
                        row.forEach(c => {
                            const val = normalize(String(c || ''));
                            if (KNOWN_KEYWORDS.some(k => val.includes(k))) valid++;
                        });
                        return valid > 0;
                    };

                    // We always fetch bestRow and 1 row after it to check for sub-headers
                    // Fetch: bestRow, bestRow+1, bestRow+2...
                    const fetchOptions = { header: 1, range: bestRow, defval: '' };
                    const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, fetchOptions);

                    if (rawData.length === 0) {
                        return { sheetName, headers: [], data: [] };
                    }

                    const primaryHeaderRow = rawData[0];
                    const secondaryHeaderRow = rawData[1];
                    const looksLikeDoubleHeader = hasKeywords(secondaryHeaderRow);

                    if (looksLikeDoubleHeader) {
                        // Merge primary and secondary
                        const maxLen = Math.max(primaryHeaderRow.length, secondaryHeaderRow.length);
                        // Count bottom occurrences to detect duplicates
                        const bottomCounts = new Map<string, number>();
                        for (let i = 0; i < maxLen; i++) {
                            const bottom = String(secondaryHeaderRow[i] || '').trim();
                            if (bottom) {
                                bottomCounts.set(bottom, (bottomCounts.get(bottom) || 0) + 1);
                            }
                        }

                        for (let i = 0; i < maxLen; i++) {
                            const top = String(primaryHeaderRow[i] || '').trim();
                            const bottom = String(secondaryHeaderRow[i] || '').trim();

                            // Merging Logic: 
                            // If bottom exists, usually it's the specific field.
                            // If bottom is unique, use it directly (User preference: "Don't show parent").
                            // If bottom is duplicated (e.g. "Amount"), preserve parent context.
                            // If bottom is empty, top is the header (vertical merge).
                            let merged = top;
                            if (bottom) {
                                if ((bottomCounts.get(bottom) || 0) === 1) {
                                    merged = bottom;
                                } else {
                                    merged = top ? `${top} ${bottom}` : bottom;
                                }
                            }
                            headers.push(merged);
                        }
                        dataRows = rawData.slice(2);
                    } else {
                        // Single header row
                        headers = rawData[0].map(String);
                        dataRows = rawData.slice(1);
                    }

                    // Convert data rows to Objects manually since we did header: 1
                    // This is cleaner than calling sheet_to_json twice.
                    const startDataRowOffset = looksLikeDoubleHeader ? 2 : 1;
                    const jsonData: ExcelRow[] = dataRows.map((rowArr: any[], i: number) => {
                        const obj: any = {};
                        // Calculate 1-based Row Index (STT)
                        // bestRow is 0-based index of the Header row finding
                        // startDataRowOffset is offset from bestRow to first data row
                        // i is index within dataRows
                        // +1 for 1-based human readable
                        obj['__rowNum__'] = bestRow + startDataRowOffset + i + 1;

                        headers.forEach((h, colIdx) => {
                            if (h) {
                                // Handle duplicate headers? heuristicMapper just scans keys so last write wins usually. 
                                // But let's just assign.
                                obj[h] = rowArr[colIdx] || '';
                            }
                        });
                        return obj as ExcelRow;
                    });

                    return {
                        sheetName,
                        headers: headers.filter(h => !!h && h.trim() !== ''),
                        data: jsonData,
                        headerRowIndex: bestRow + 1
                    };
                });

                resolve({
                    fileName: file.name,
                    sheets
                });
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

