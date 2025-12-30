import React, { useMemo, useState } from 'react';
import type { ComparisonResult } from '../types';
import { cn } from '../utils/cn';
import { Download, AlertCircle, CheckCircle, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ResultsTableProps {
    results: ComparisonResult[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
    const [filter, setFilter] = useState<'ALL' | 'MISMATCH' | 'MISSING'>('ALL');
    const [search, setSearch] = useState('');

    const filteredResults = useMemo(() => {
        return results.filter(r => {
            // Status Filter
            if (filter === 'MISMATCH' && r.status === 'MATCH') return false;
            if (filter === 'MISSING' && (r.status === 'MATCH' || r.status === 'MISMATCH')) return false;

            // Search Filter
            if (search) {
                const term = search.toLowerCase();
                return (
                    r.contractNo.toLowerCase().includes(term) ||
                    r.id.toLowerCase().includes(term)
                );
            }
            return true;
        });
    }, [results, filter, search]);

    const stats = useMemo(() => ({
        match: results.filter(r => r.status === 'MATCH').length,
        mismatch: results.filter(r => r.status === 'MISMATCH').length,
        missing: results.filter(r => r.status.includes('MISSING')).length,
    }), [results]);

    const downloadReport = () => {
        const ws = XLSX.utils.json_to_sheet(results.map(r => ({
            'Type': r.status,
            'Contract No': r.contractNo,
            'Date': r.date,
            'Bill No': r.billNo,
            'Total Cost File A': r.totalCostA,
            'Total Cost File B': r.totalCostB,
            'Difference': r.diff,
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Comparison Report");
        XLSX.writeFile(wb, "comparison_report.xlsx");
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Matched</p>
                        <p className="text-2xl font-bold text-green-600">{stats.match}</p>
                    </div>
                    <CheckCircle className="text-green-100 w-10 h-10 bg-green-500 rounded-full p-2" />
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Mismatched</p>
                        <p className="text-2xl font-bold text-red-600">{stats.mismatch}</p>
                    </div>
                    <AlertCircle className="text-red-100 w-10 h-10 bg-red-500 rounded-full p-2" />
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Missing</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.missing}</p>
                    </div>
                    <AlertCircle className="text-yellow-100 w-10 h-10 bg-yellow-500 rounded-full p-2" />
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", filter === 'ALL' ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('MISMATCH')}
                        className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", filter === 'MISMATCH' ? "bg-red-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100")}
                    >
                        Mismatch
                    </button>
                    <button
                        onClick={() => setFilter('MISSING')}
                        className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", filter === 'MISSING' ? "bg-yellow-500 text-white" : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100")}
                    >
                        Missing
                    </button>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search contract..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={downloadReport}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total A</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total B</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Diff</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredResults.map((r, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={cn(
                                        "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                                        r.status === 'MATCH' ? "bg-green-100 text-green-800" :
                                            r.status === 'MISMATCH' ? "bg-red-100 text-red-800" :
                                                "bg-yellow-100 text-yellow-800"
                                    )}>
                                        {r.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.contractNo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{r.totalCostA?.toLocaleString() ?? '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{r.totalCostB?.toLocaleString() ?? '-'}</td>
                                <td className={cn(
                                    "px-6 py-4 whitespace-nowrap text-sm text-right font-semibold",
                                    r.diff === 0 ? "text-gray-400" : "text-red-600"
                                )}>
                                    {r.diff !== 0 ? (r.diff > 0 ? `+${r.diff.toLocaleString()}` : r.diff.toLocaleString()) : '-'}
                                </td>
                            </tr>
                        ))}
                        {filteredResults.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No records found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
