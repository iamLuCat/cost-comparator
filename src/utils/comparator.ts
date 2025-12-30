import type { CostMapping, ComparisonResult, FileData, ExcelRow } from '../types';


const normalizeStr = (val: any): string => {
    if (val === null || val === undefined) return '';
    // Strong normalization: remove whitespace, diacritics, lowercase
    // e.g. "  SỐ CONT 123 " -> "socont123"
    // But for Value matching (like actual Cont No), maybe just trim.
    // The user requirement implies keys are Cont and Date.
    return String(val).trim().toUpperCase(); // Keep Case for ID? Usually Uppercase is safer.
};

const normalizeDate = (val: any): string => {
    if (val instanceof Date) return val.toISOString().split('T')[0];
    // Handle common formats if needed, for now exact string match
    return String(val).trim();
};

const parseCost = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
};

// Calculate total cost for a row based on mapping
const calculateRowCost = (row: ExcelRow, mapping: CostMapping): number => {
    let total = 0;
    // Sum all categories
    const categories: (keyof CostMapping)[] = ['liftUnload', 'containerDeposit', 'toll', 'transportFee', 'freightCharge', 'warehouseTransfer'];

    categories.forEach(cat => {
        const columns = mapping[cat] as string[]; // Type assertion
        columns.forEach(col => {
            total += parseCost(row[col]);
        });
    });
    return total;
};




export const compareFiles = (
    fileA: FileData,
    fileB: FileData,
    mappingA: CostMapping,
    mappingB: CostMapping,
    selectedSheetsA: string[], // List of sheet names to use
    selectedSheetsB: string[]
): ComparisonResult[] => {

    // Data Structure: Map<Key, { rows: [], totalCost: 0 }>
    interface AggregatedData {
        rows: ExcelRow[];
        totalCost: number;
        breakdown: Record<string, number>; // Accumulated breakdown
        contractNo: string;
        date: string;
        billNo?: string;
    }

    const aggregateParams = (file: FileData, mapping: CostMapping, selectedSheets: string[]) => {
        const map = new Map<string, AggregatedData>();

        file.sheets.forEach(sheet => {
            if (!selectedSheets.includes(sheet.sheetName)) return;

            sheet.data.forEach(row => {
                // 1. Get Key
                const contractNo = normalizeStr(row[mapping.contractNo]);
                const date = normalizeDate(row[mapping.date]);
                // If BillNo is used, append it
                // Let's stick to Cont+Date as primary, as requested.

                if (!contractNo || !date) return; // Skip invalid rows

                const key = `${contractNo}|${date}`;

                // 2. Calculate Cost
                const cost = calculateRowCost(row, mapping);
                // const rowBreakdown = getBreakdown(row, mapping); 

                if (!map.has(key)) {
                    map.set(key, {
                        rows: [],
                        totalCost: 0,
                        breakdown: {},
                        contractNo: row[mapping.contractNo], // Store original value
                        date: row[mapping.date],
                        billNo: mapping.billNo ? row[mapping.billNo] : undefined
                    });
                }

                const entry = map.get(key)!;
                entry.rows.push(row);
                entry.totalCost += cost;
                // Aggregate breakdown logic would go here if needed
            });
        });
        return map;
    };

    const aggA = aggregateParams(fileA, mappingA, selectedSheetsA);
    const aggB = aggregateParams(fileB, mappingB, selectedSheetsB);

    const results: ComparisonResult[] = [];
    const processedKeys = new Set<string>();

    // Compare A against B
    aggA.forEach((dataA, key) => {
        processedKeys.add(key);
        const dataB = aggB.get(key);

        if (dataB) {
            const diff = dataA.totalCost - dataB.totalCost;
            // Tolerance for floating point
            const status = Math.abs(diff) < 1.0 ? 'MATCH' : 'MISMATCH';

            results.push({
                id: key,
                contractNo: dataA.contractNo,
                date: dataA.date,
                billNo: dataA.billNo,
                totalCostA: dataA.totalCost,
                totalCostB: dataB.totalCost,
                diff,
                status,
                rowsA: dataA.rows,
                rowsB: dataB.rows
            });
        } else {
            results.push({
                id: key,
                contractNo: dataA.contractNo,
                date: dataA.date,
                billNo: dataA.billNo,
                totalCostA: dataA.totalCost,
                totalCostB: 0,
                diff: dataA.totalCost,
                status: 'MISSING_B',
                rowsA: dataA.rows,
                rowsB: []
            });
        }
    });

    // Check Missing A
    aggB.forEach((dataB, key) => {
        if (processedKeys.has(key)) return;

        results.push({
            id: key,
            contractNo: dataB.contractNo,
            date: dataB.date,
            billNo: dataB.billNo,
            totalCostA: 0,
            totalCostB: dataB.totalCost,
            diff: -dataB.totalCost,
            status: 'MISSING_A',
            rowsA: [],
            rowsB: dataB.rows
        });
    });

    return results;
};
