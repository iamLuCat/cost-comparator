import React, { useMemo, useState } from 'react';
import type { ComparisonResult, ExcelRow, CostMapping } from '../types';
import { cn } from '../utils/cn';
import { Download, ChevronDown, ChevronRight, FileText, Search, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ResultsTableProps {
    results: ComparisonResult[];
    mappingA: CostMapping;
    mappingB: CostMapping;
}

const STATUS_MAP: Record<string, string> = {
    'MATCH': 'Khớp',
    'MISMATCH': 'Lệch',
    'MISSING_A': 'Thiếu ở A',
    'MISSING_B': 'Thiếu ở B'
};

export const ResultsTable: React.FC<ResultsTableProps> = ({ results, mappingA, mappingB }) => {
    const [filter, setFilter] = useState<'ALL' | 'MISMATCH' | 'MISSING' | 'MATCH'>('ALL');
    const [search, setSearch] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    const [sortConfig, setSortConfig] = useState<{ key: keyof ComparisonResult | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    const handleSort = (key: keyof ComparisonResult) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredResults = useMemo(() => {
        let res = results.filter(r => {
            if (filter === 'MATCH' && r.status !== 'MATCH') return false;
            if (filter === 'MISMATCH' && r.status !== 'MISMATCH') return false;
            if (filter === 'MISSING' && !r.status.includes('MISSING')) return false;
            if (search) {
                const term = search.toLowerCase();
                return (
                    r.contractNo.toLowerCase().includes(term) ||
                    r.id.toLowerCase().includes(term)
                );
            }
            return true;
        });

        if (sortConfig.key) {
            res.sort((a, b) => {
                const aValue = a[sortConfig.key!] ?? '';
                const bValue = b[sortConfig.key!] ?? '';

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return res;
    }, [results, filter, search, sortConfig]);

    // ... (rest of logic: stats, downloadReport, format functions) ...
    const stats = useMemo(() => ({
        match: results.filter(r => r.status === 'MATCH').length,
        mismatch: results.filter(r => r.status === 'MISMATCH').length,
        missing: results.filter(r => r.status.includes('MISSING')).length,
    }), [results]);

    const downloadReport = () => {
        const flatData = results.map(r => ({
            'Status': r.status,
            'Contract No': r.contractNo,
            'Date': r.date,
            'Total A': r.totalCostA,
            'Total B': r.totalCostB,
            'Difference': r.diff,
            'Files A': Array.from(new Set(r.rowsA.map((x: any) => x._sourceFile))).join(', '),
            'Files B': Array.from(new Set(r.rowsB.map((x: any) => x._sourceFile))).join(', ')
        }));
        const worksheet = XLSX.utils.json_to_sheet(flatData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
        XLSX.writeFile(workbook, "Detailed_Comparison_Report.xlsx");
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    const formatDate = (val: any): string => {
        if (!val) return '';

        let numVal = typeof val === 'number' ? val : Number(val);

        // Check if valid Excel serial date (approx range: 1954 to 2079)
        // 20000 = year 1954, 60000 = year 2064. Good enough heuristics.
        if (!isNaN(numVal) && numVal > 20000 && numVal < 80000) {
            const date = new Date(Math.round((numVal - 25569) * 86400 * 1000));
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const yyyy = date.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
        }

        return String(val);
    };

    const renderDetailRows = (rows: ExcelRow[], side: 'A' | 'B', mapping: CostMapping) => {
        // ... (renderDetailRows logic is fine, omitting large chunks for brevity if not changing, but previous replace truncated it too much) ...
        // Actually, let's just make sure we insert the Toolbar button correctly.
        // We can jump to the JSX return.
        if (rows.length === 0) return <p className="text-sm text-gray-400 italic">Không có dữ liệu Bên {side}</p>;

        const relevantKeys = new Set<string>([
            mapping.contractNo,
            mapping.date,
            mapping.billNo,
            ...mapping.liftUnload,
            ...mapping.containerDeposit,
            ...mapping.toll,
            ...mapping.transportFee,
            ...mapping.warehouseTransfer,
            ...mapping.weighingFee,
            ...mapping.cleaningFee,
            ...mapping.overweightFee,
            ...mapping.detentionFee,
            ...mapping.storageFee,
            ...mapping.vat
        ].filter((k): k is string => !!k)); // Filter out empty strings/undefined

        if (mapping.additionalCosts) {
            Object.values(mapping.additionalCosts).forEach(cols => {
                if (Array.isArray(cols)) {
                    cols.forEach(c => relevantKeys.add(c));
                }
            });
        }

        return (
            <div className="text-xs">
                <h4 className="font-bold text-gray-700 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Nguồn Bên {side} ({rows.length} dòng)
                </h4>
                <div className="bg-gray-50 rounded border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-2 py-1 text-center w-16">Row #</th>
                                <th className="px-2 py-1 text-left">Sheet</th>
                                <th className="px-2 py-1 text-right">Row Data (Only Costs)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {rows.map((row: any, idx) => (
                                <tr key={idx}>
                                    <td className="px-2 py-1 text-center text-gray-500 font-mono text-xs">{row.__rowNum__}</td>
                                    <td className="px-2 py-1 text-gray-500">{row._sourceSheet}</td>
                                    <td className="px-2 py-1 text-right font-mono text-gray-600">
                                        <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-1 text-left">
                                            {Object.entries(row)
                                                .filter(([key]) => relevantKeys.has(key))
                                                .map(([key, val]) => {
                                                    let displayVal = String(val);

                                                    // Special handling based on column type
                                                    if (key === mapping.billNo) {
                                                        displayVal = String(val);
                                                    } else if (key === mapping.date) {
                                                        displayVal = formatDate(val);
                                                    } else if (typeof val === 'number') {
                                                        // Default number handling (likely a cost) -> Currency
                                                        displayVal = formatCurrency(val);
                                                    }

                                                    return (
                                                        <React.Fragment key={key}>
                                                            <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{key}:</div>
                                                            <div className="text-gray-900 text-sm break-all">
                                                                {displayVal}
                                                            </div>
                                                        </React.Fragment>
                                                    );
                                                })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const paginatedResults = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredResults.slice(start, start + itemsPerPage);
    }, [filteredResults, currentPage]);

    const totalPages = Math.ceil(filteredResults.length / itemsPerPage);

    // Reset page when filter/search changes
    useMemo(() => {
        setCurrentPage(1);
    }, [filter, search]);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="hidden sm:grid grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded border shadow-sm flex justify-between">
                    <span className="text-gray-500">Khớp</span><span className="font-bold text-green-600">{stats.match}</span>
                </div>
                <div className="bg-white p-3 rounded border shadow-sm flex justify-between">
                    <span className="text-gray-500">Lệch</span><span className="font-bold text-red-600">{stats.mismatch}</span>
                </div>
                <div className="bg-white p-3 rounded border shadow-sm flex justify-between">
                    <span className="text-gray-500">Thiếu</span><span className="font-bold text-yellow-600">{stats.missing}</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex justify-between items-center bg-white p-3 rounded border">
                <div className="flex gap-2 text-sm">
                    <button onClick={() => setFilter('ALL')} className={cn("px-3 py-1 rounded", filter === 'ALL' && "bg-gray-800 text-white")}>Tất cả</button>
                    <button onClick={() => setFilter('MATCH')} className={cn("px-3 py-1 rounded", filter === 'MATCH' && "bg-green-600 text-white")}>Khớp</button>
                    <button onClick={() => setFilter('MISMATCH')} className={cn("px-3 py-1 rounded", filter === 'MISMATCH' && "bg-red-600 text-white")}>Lệch</button>
                    <button onClick={() => setFilter('MISSING')} className={cn("px-3 py-1 rounded", filter === 'MISSING' && "bg-yellow-500 text-white")}>Thiếu</button>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="border rounded px-2 py-1 text-sm pr-8"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    <button onClick={downloadReport} className="bg-blue-600 text-white px-3 py-1 rounded text-sm"><Download className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white border rounded shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto min-h-[600px]"> {/* Fixed min-height roughly for 20 items */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="w-8"></th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-1">
                                        Trạng Thái
                                        {sortConfig.key === 'status' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : <ArrowUpDown className="w-3 h-3 text-gray-300" />}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                    onClick={() => handleSort('contractNo')}
                                >
                                    <div className="flex items-center gap-1">
                                        Số Cont / Ngày
                                        {sortConfig.key === 'contractNo' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : <ArrowUpDown className="w-3 h-3 text-gray-300" />}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                    onClick={() => handleSort('totalCostA')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Tổng A
                                        {sortConfig.key === 'totalCostA' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : <ArrowUpDown className="w-3 h-3 text-gray-300" />}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                    onClick={() => handleSort('totalCostB')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Tổng B
                                        {sortConfig.key === 'totalCostB' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : <ArrowUpDown className="w-3 h-3 text-gray-300" />}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors select-none"
                                    onClick={() => handleSort('diff')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Chênh lệch
                                        {sortConfig.key === 'diff' ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : <ArrowUpDown className="w-3 h-3 text-gray-300" />}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedResults.map((r) => (
                                <React.Fragment key={r.id}>
                                    <tr
                                        className={cn("hover:bg-gray-50 cursor-pointer transition-colors h-[41px]", expandedIds.has(r.id) && "bg-blue-50")}
                                        onClick={() => toggleExpand(r.id)}
                                    >
                                        <td className="px-2 text-gray-400">
                                            {expandedIds.has(r.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={cn(
                                                "px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full",
                                                r.status === 'MATCH' ? "bg-green-100 text-green-800" :
                                                    r.status === 'MISMATCH' ? "bg-red-100 text-red-800" :
                                                        "bg-yellow-100 text-yellow-800"
                                            )}>
                                                {STATUS_MAP[r.status] || r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-medium text-gray-900">{r.contractNo}</div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSearch(r.contractNo);
                                                    }}
                                                    className="text-gray-400 hover:text-blue-500 p-1 rounded hover:bg-gray-100"
                                                    title="Tìm theo số container này"
                                                >
                                                    <Search className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-500">{formatDate(r.date)}</div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(r.totalCostA)}</td>
                                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(r.totalCostB)}</td>
                                        <td className={cn("px-4 py-2 text-sm text-right font-bold", r.diff !== 0 ? "text-red-600" : "text-gray-400")}>
                                            {formatCurrency(r.diff)}
                                        </td>
                                    </tr>

                                    {/* DETAIL SUB-ROW */}
                                    {expandedIds.has(r.id) && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={6} className="px-4 py-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {renderDetailRows(r.rowsA, 'A', mappingA)}
                                                    {renderDetailRows(r.rowsB, 'B', mappingB)}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {/* Empty placeholder rows to maintain height */}
                            {Array.from({ length: Math.max(0, itemsPerPage - paginatedResults.length) }).map((_, i) => (
                                <tr key={`empty-${i}`} className="h-[41px]">
                                    <td colSpan={6}>&nbsp;</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredResults.length)}</span> trong số <span className="font-medium">{filteredResults.length}</span> kết quả
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronDown className="h-5 w-5 rotate-90" /> {/* Reusing ChevronDown as Left */}
                                    </button>
                                    {/* Simple Page Numbers: First ... Current-1, Current, Current+1 ... Last */}
                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
