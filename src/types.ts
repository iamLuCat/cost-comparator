export interface ExcelRow {
    [key: string]: any;
}

export interface SheetData {
    sheetName: string;
    headers: string[];
    data: ExcelRow[];
}

export interface FileData {
    fileName: string;
    sheets: SheetData[];
}

export interface CostMapping {
    // Key identifiers
    contractNo: string; // Single column
    date: string;       // Single column
    billNo?: string;    // Optional single column

    // Cost Categories (List of columns)
    liftUnload: string[];        // Ha/Nang
    containerDeposit: string[];  // Cuoc vo/Neo xe
    toll: string[];              // Phi cau duong/BOT
    transportFee: string[];      // Cuoc xe
    freightCharge: string[];     // Cuoc cont
    warehouseTransfer: string[]; // Chuyen kho
}

export interface ComparisonResult {
    id: string; // Unique key (Cont + Date)
    contractNo: string;
    date: string;
    billNo?: string;

    // Totals
    totalCostA: number;
    totalCostB: number;
    diff: number;

    // Breakdown (Optional, for detailed view)
    breakdownA?: Record<keyof CostMapping, number>;
    breakdownB?: Record<keyof CostMapping, number>;

    status: 'MATCH' | 'MISMATCH' | 'MISSING_A' | 'MISSING_B';

    // Source rows for debugging (could be multiple if aggregated)
    rowsA: ExcelRow[];
    rowsB: ExcelRow[];
}
