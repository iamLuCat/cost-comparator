import * as XLSX from 'xlsx';
import type { FileData, SheetData, ExcelRow } from '../types';

export const parseExcelFile = (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                const sheets: SheetData[] = workbook.SheetNames.map(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];

                    // Get Headers
                    const headerData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
                    const headers = headerData.length > 0 ? (headerData[0] as string[]) : [];

                    // Get Data
                    const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: '' });

                    return {
                        sheetName,
                        headers: headers.filter(h => !!h), // Filter empty headers
                        data: jsonData
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
