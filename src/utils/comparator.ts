import type { CostMapping, ComparisonResult, FileData, ExcelRow } from '../types';

const normalizeStr = (val: any): string => {
    if (val === null || val === undefined) return '';
    return String(val).trim().toUpperCase();
};

const normalizeDate = (val: any): string => {
    if (val instanceof Date) return val.toISOString().split('T')[0];
    return String(val).trim();
};

const normalizeContainerNo = (val: any): string => {
    const str = normalizeStr(val);
    const match = str.match(/[A-Z]{4}[0-9]+/);
    return match ? match[0] : str;
};

const normalizeBillNo = (val: any): string => {
    const str = normalizeStr(val);
    const match = str.match(/\b[A-Z0-9]*[0-9]+[A-Z0-9]*\b/);
    return match ? match[0] : str;
};

const parseCost = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
};

export const calculateRowCost = (row: ExcelRow, mapping: CostMapping): number => {
    let total = 0;
    const categories: (keyof CostMapping)[] = ['liftUnload', 'containerDeposit', 'toll', 'transportFee', 'warehouseTransfer', 'weighingFee', 'cleaningFee', 'overweightFee', 'detentionFee', 'storageFee', 'vat'];

    categories.forEach(cat => {
        const columns = mapping[cat] as string[];
        columns.forEach(col => {
            total += parseCost(row[col]);
        });
    });

    if (mapping.additionalCosts) {
        Object.values(mapping.additionalCosts).forEach(columns => {
            columns.forEach(col => {
                total += parseCost(row[col]);
            });
        });
    }
    return total;
};


export const compareBatchFiles = (
    filesA: FileData[],
    filesB: FileData[],
    mappingA: CostMapping,
    mappingB: CostMapping,
    selectedSheetsA: string[], // Format: "FileName::SheetName"
    selectedSheetsB: string[]
): ComparisonResult[] => {

    interface AggregatedData {
        rows: ExcelRow[];
        totalCost: number;
        contractNo: string;
        date: string;
        billNo?: string;
    }

    const aggregateParams = (files: FileData[], mapping: CostMapping, selectedSheets: string[]) => {
        const map = new Map<string, AggregatedData>();

        files.forEach(file => {
            file.sheets.forEach(sheet => {
                // Check if this sheet is selected
                // Key format: FileName::SheetName
                const sheetKey = `${file.fileName}::${sheet.sheetName}`;
                if (!selectedSheets.includes(sheetKey)) return;

                sheet.data.forEach(row => {
                    const contractNo = normalizeContainerNo(row[mapping.contractNo]);
                    const date = normalizeDate(row[mapping.date]);
                    const billNoStr = mapping.billNo ? normalizeBillNo(row[mapping.billNo]) : '';

                    // Strict requirement: Compare Contract -> Date -> Bill
                    if (!contractNo || !date) return;

                    // Key now includes Bill No
                    const key = `${contractNo}|${date}|${billNoStr}`;
                    const cost = calculateRowCost(row, mapping);

                    if (!map.has(key)) {
                        map.set(key, {
                            rows: [],
                            totalCost: 0,
                            contractNo: row[mapping.contractNo], // Keep original value
                            date: row[mapping.date],
                            billNo: mapping.billNo ? row[mapping.billNo] : undefined
                        });
                    }

                    const entry = map.get(key)!;
                    // Enhance row with source info for Details View
                    const enhancedRow = {
                        ...row,
                        _sourceFile: file.fileName,
                        _sourceSheet: sheet.sheetName
                    };
                    entry.rows.push(enhancedRow);
                    entry.totalCost += cost;
                });
            });
        });
        return map;
    };

    const aggA = aggregateParams(filesA, mappingA, selectedSheetsA);
    const aggB = aggregateParams(filesB, mappingB, selectedSheetsB);

    const results: ComparisonResult[] = [];
    const processedKeys = new Set<string>();

    aggA.forEach((dataA, key) => {
        processedKeys.add(key);
        const dataB = aggB.get(key);

        if (dataB) {
            const diff = dataA.totalCost - dataB.totalCost;
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
