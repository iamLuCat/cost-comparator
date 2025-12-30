import React from 'react';
import type { CostMapping } from '../types';
import { Wand2 } from 'lucide-react';
import { scanHeaders } from '../utils/heuristicMapper';

interface ColumnMapperProps {
    title: string;
    headers: string[];
    mapping: CostMapping;
    onChange: (newMapping: CostMapping) => void;
}

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
    title,
    headers,
    mapping,
    onChange
}) => {

    const handleAutoDetect = () => {
        const suggested = scanHeaders(headers);
        // Merge suggestion with existing? Or overwrite? 
        // Overwrite is cleaner for now.
        onChange(suggested);
    };

    const updateSingle = (field: keyof CostMapping, value: string) => {
        onChange({ ...mapping, [field]: value });
    };

    const updateMulti = (field: keyof CostMapping, value: string[]) => {
        onChange({ ...mapping, [field]: value });
    };

    const toggleMulti = (field: keyof CostMapping, col: string) => {
        const current = (mapping[field] as string[]) || [];
        if (current.includes(col)) {
            updateMulti(field, current.filter(c => c !== col));
        } else {
            updateMulti(field, [...current, col]);
        }
    };

    const renderSingleSelect = (label: string, field: keyof CostMapping, required = false) => (
        <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
                value={mapping[field] as string}
                onChange={(e) => updateSingle(field, e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            >
                <option value="">-- Select Column --</option>
                {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                ))}
            </select>
        </div>
    );

    const renderMultiSelect = (label: string, field: keyof CostMapping) => {
        const selected = (mapping[field] as string[]) || [];

        return (
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    {label}
                </label>
                <div className="border border-gray-200 rounded-md p-2 max-h-32 overflow-y-auto space-y-1 bg-gray-50">
                    {headers.map(h => (
                        <label key={h} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                            <input
                                type="checkbox"
                                checked={selected.includes(h)}
                                onChange={() => toggleMulti(field, h)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="truncate" title={h}>{h}</span>
                        </label>
                    ))}
                </div>
                {selected.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">{selected.length} columns selected</p>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-semibold text-gray-800">{title}</h3>
                <button
                    onClick={handleAutoDetect}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-100 transition-colors"
                >
                    <Wand2 className="w-4 h-4" /> Auto-Detect
                </button>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 border-l-4 border-blue-500 pl-2">Identifiers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderSingleSelect('Container No (Số Cont)', 'contractNo', true)}
                    {renderSingleSelect('Date (Ngày)', 'date', true)}
                    {renderSingleSelect('Bill No (Số Bill)', 'billNo')}
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 border-l-4 border-green-500 pl-2">Cost Categories</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderMultiSelect('Lift/Unload (Hạ/Nâng)', 'liftUnload')}
                    {renderMultiSelect('Deposit (Cược vỏ/Neo xe)', 'containerDeposit')}
                    {renderMultiSelect('Toll (Phí Cầu Đường)', 'toll')}
                    {renderMultiSelect('Transport (Cước Xe)', 'transportFee')}
                    {renderMultiSelect('Freight (Cước Cont)', 'freightCharge')}
                    {renderMultiSelect('Warehouse (Chuyển Kho)', 'warehouseTransfer')}
                </div>
            </div>
        </div>
    );
};
