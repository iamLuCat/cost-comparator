import { describe, it, expect } from 'vitest';
import { calculateRowCost, compareBatchFiles } from './comparator';
import type { CostMapping, ExcelRow, FileData } from '../types';

describe('calculateRowCost', () => {
    const baseMapping: CostMapping = {
        contractNo: 'CONT',
        date: 'DATE',
        billNo: 'BILL',
        liftUnload: ['LIFT'],
        containerDeposit: [],
        toll: [],
        transportFee: [],
        warehouseTransfer: [],
        weighingFee: [],
        cleaningFee: [],
        overweightFee: [],
        detentionFee: [],
        storageFee: [],
        vat: []
    };

    it('should sum standard costs correctly', () => {
        const row: ExcelRow = {
            __rowNum__: 1,
            LIFT: 100,
            OTHER: 50
        };
        const cost = calculateRowCost(row, baseMapping);
        expect(cost).toBe(100);
    });

    it('should include additional costs', () => {
        const mapping: CostMapping = {
            ...baseMapping,
            additionalCosts: {
                'Custom Fee': ['CUSTOM1', 'CUSTOM2']
            }
        };
        const row: ExcelRow = {
            __rowNum__: 1,
            LIFT: 100,
            CUSTOM1: 50,
            CUSTOM2: 25
        };
        const cost = calculateRowCost(row, mapping);
        expect(cost).toBe(100 + 50 + 25);
    });

    it('should handle non-numeric values gracefully', () => {
        const row: ExcelRow = {
            __rowNum__: 1,
            LIFT: '100,000', // string with commas
        };
        const cost = calculateRowCost(row, baseMapping);
        // parseCost regex removes non-numeric so 100,000 -> 100000
        expect(cost).toBe(100000);
    });
});

describe('compareBatchFiles', () => {
    const emptyArrays = {
        containerDeposit: [], toll: [], transportFee: [], warehouseTransfer: [], weighingFee: [], cleaningFee: [], overweightFee: [], detentionFee: [], storageFee: [], vat: []
    };

    it('should correctly compare files including additional costs', () => {
        const fileA: FileData = {
            fileName: 'FileA',
            sheets: [{
                sheetName: 'Sheet1',
                headers: ['CONT', 'DATE', 'BILL', 'LIFT_A', 'CUSTOM_A'],
                data: [{ __rowNum__: 1, CONT: 'C1', DATE: '2023-01-01', BILL: 'B1', LIFT_A: 100, CUSTOM_A: 20 }]
            }]
        };
        const fileB: FileData = {
            fileName: 'FileB',
            sheets: [{
                sheetName: 'Sheet1',
                headers: ['CONT', 'DATE', 'BILL', 'LIFT_B', 'CUSTOM_B'],
                data: [{ __rowNum__: 1, CONT: 'C1', DATE: '2023-01-01', BILL: 'B1', LIFT_B: 100, CUSTOM_B: 20 }]
            }]
        };

        const mappingA: CostMapping = {
            contractNo: 'CONT',
            date: 'DATE',
            billNo: 'BILL',
            liftUnload: ['LIFT_A'],
            ...emptyArrays,
            additionalCosts: {
                'MyFee': ['CUSTOM_A']
            }
        };

        const mappingB: CostMapping = {
            contractNo: 'CONT',
            date: 'DATE',
            billNo: 'BILL',
            liftUnload: ['LIFT_B'],
            ...emptyArrays,
            additionalCosts: {
                'MyFee': ['CUSTOM_B']
            }
        };

        const results = compareBatchFiles(
            [fileA],
            [fileB],
            mappingA,
            mappingB,
            ['FileA::Sheet1'],
            ['FileB::Sheet1']
        );

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('MATCH');
        expect(results[0].totalCostA).toBe(120);
        expect(results[0].totalCostB).toBe(120);
    });

    it('should normalize container numbers (remove RE suffix)', () => {
        const fileA: FileData = {
            fileName: 'FileA',
            sheets: [{
                sheetName: 'Sheet1',
                headers: ['CONT', 'DATE', 'BILL'],
                data: [{ __rowNum__: 1, CONT: 'MSKU1906227 RE', DATE: '2023-01-01', BILL: 'B1' }]
            }]
        };
        const fileB: FileData = {
            fileName: 'FileB',
            sheets: [{
                sheetName: 'Sheet1',
                headers: ['CONT', 'DATE', 'BILL'],
                data: [{ __rowNum__: 1, CONT: 'MSKU1906227', DATE: '2023-01-01', BILL: 'B1' }]
            }]
        };

        const mappingA: CostMapping = {
            contractNo: 'CONT',
            date: 'DATE',
            billNo: 'BILL',
            liftUnload: [],
            ...emptyArrays
        };

        const mappingB: CostMapping = {
            contractNo: 'CONT',
            date: 'DATE',
            billNo: 'BILL',
            liftUnload: [],
            ...emptyArrays
        };

        const results = compareBatchFiles([fileA], [fileB], mappingA, mappingB, ['FileA::Sheet1'], ['FileB::Sheet1']);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('MATCH');
        expect(results[0].contractNo).toContain('MSKU1906227');
    });

    it('should extract first valid bill number', () => {
        const fileA: FileData = {
            fileName: 'FileA',
            sheets: [{
                sheetName: 'Sheet1',
                headers: ['CONT', 'DATE', 'BILL'],
                data: [{ __rowNum__: 1, CONT: 'C1', DATE: '2023-01-01', BILL: '7265053640' }]
            }]
        };
        const fileB: FileData = {
            fileName: 'FileB',
            sheets: [{
                sheetName: 'Sheet1',
                headers: ['CONT', 'DATE', 'BILL'],
                data: [{ __rowNum__: 1, CONT: 'C1', DATE: '2023-01-01', BILL: '7265053640 này đã hủy- bill đúng 7265123020' }]
            }]
        };

        const mappingA: CostMapping = {
            contractNo: 'CONT',
            date: 'DATE',
            billNo: 'BILL',
            liftUnload: [],
            ...emptyArrays
        };

        const mappingB: CostMapping = {
            contractNo: 'CONT',
            date: 'DATE',
            billNo: 'BILL',
            liftUnload: [],
            ...emptyArrays
        };

        const results = compareBatchFiles([fileA], [fileB], mappingA, mappingB, ['FileA::Sheet1'], ['FileB::Sheet1']);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('MATCH');
        expect(results[0].billNo).toBe('7265053640');
    });
});
