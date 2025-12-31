import React from 'react';
import type { CostMapping } from '../types';
import { Wand2, X } from 'lucide-react';
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

    const toggleMultiCustom = (costName: string, col: string) => {
        const currentCustom = mapping.additionalCosts || {};
        const currentCols = currentCustom[costName] || [];

        let newCols: string[];
        if (currentCols.includes(col)) {
            newCols = currentCols.filter(c => c !== col);
        } else {
            newCols = [...currentCols, col];
        }

        onChange({
            ...mapping,
            additionalCosts: {
                ...currentCustom,
                [costName]: newCols
            }
        });
    };



    const removeCustomCost = (costName: string) => {
        if (!window.confirm(`Xóa chi phí "${costName}"?`)) return;
        const currentCustom = mapping.additionalCosts || {};
        const nextCustom = { ...currentCustom };
        delete nextCustom[costName];

        onChange({
            ...mapping,
            additionalCosts: nextCustom
        });
    };

    // Calculate all columns currently used in OTHER fields (excluding the current one)
    const getUsedColumns = (excludeField: keyof CostMapping) => {
        const used = new Set<string>();
        Object.entries(mapping).forEach(([key, val]) => {
            if (key === excludeField) return; // Don't count self
            if (Array.isArray(val)) {
                val.forEach(v => used.add(v));
            } else if (typeof val === 'string' && val) {
                used.add(val);
            }
        });
        return used;
    };

    const getUsedColumnsCustom = (excludeCostName: string) => {
        const used = new Set<string>();
        // Check standard fields
        Object.entries(mapping).forEach(([key, val]) => {
            if (key === 'additionalCosts') return;
            if (Array.isArray(val)) {
                val.forEach(v => used.add(v));
            } else if (typeof val === 'string' && val) {
                used.add(val);
            }
        });
        // Check other custom fields
        if (mapping.additionalCosts) {
            Object.entries(mapping.additionalCosts).forEach(([key, val]) => {
                if (key === excludeCostName) return;
                val.forEach(v => used.add(v));
            });
        }
        return used;
    };

    const renderSingleSelect = (label: string, field: keyof CostMapping, required = false) => {
        const used = getUsedColumns(field);
        // Filter out used columns unless they are currently selected for this field
        const currentValue = mapping[field] as string;

        return (
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <select
                    value={currentValue}
                    onChange={(e) => updateSingle(field, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                    <option value="">-- Chọn Cột --</option>
                    {headers.filter(h => !used.has(h) || h === currentValue).map((h) => (
                        <option key={h} value={h}>
                            {h}
                        </option>
                    ))}
                </select>
            </div>
        );
    };

    const renderMultiSelect = (label: string, field: keyof CostMapping) => {
        const selected = (mapping[field] as string[]) || [];
        const used = getUsedColumns(field);

        return (
            <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    {label}
                </label>
                <div className="border border-gray-200 rounded-md p-2 max-h-32 overflow-y-auto space-y-1 bg-gray-50">
                    {headers
                        .filter(h => !used.has(h) || selected.includes(h))
                        .sort((a, b) => {
                            const aSelected = selected.includes(a);
                            const bSelected = selected.includes(b);
                            if (aSelected && !bSelected) return -1;
                            if (!aSelected && bSelected) return 1;
                            return 0; // Keep original order otherwise
                        })
                        .map(h => (
                            <label key={h} className="flex items-center gap-2 text-sm p-1 rounded cursor-pointer hover:bg-gray-100">
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
                    <p className="text-xs text-blue-600 mt-1">{selected.length} cột được chọn</p>
                )}
            </div>
        );
    };

    const renderMultiSelectCustom = (label: string) => {
        const selected = (mapping.additionalCosts?.[label]) || [];
        const used = getUsedColumnsCustom(label);

        return (
            <div className="relative group">
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {label}
                    </label>
                    <button
                        onClick={() => removeCustomCost(label)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa chi phí này"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>

                <div className="border border-gray-200 rounded-md p-2 max-h-32 overflow-y-auto space-y-1 bg-gray-50">
                    {headers
                        .filter(h => !used.has(h) || selected.includes(h))
                        .sort((a, b) => {
                            const aSelected = selected.includes(a);
                            const bSelected = selected.includes(b);
                            if (aSelected && !bSelected) return -1;
                            if (!aSelected && bSelected) return 1;
                            return 0;
                        })
                        .map(h => (
                            <label key={h} className="flex items-center gap-2 text-sm p-1 rounded cursor-pointer hover:bg-gray-100">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(h)}
                                    onChange={() => toggleMultiCustom(label, h)}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="truncate" title={h}>{h}</span>
                            </label>
                        ))}
                </div>
                {selected.length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">{selected.length} cột được chọn</p>
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
                    <Wand2 className="w-4 h-4" /> Tự động nhận diện
                </button>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-900 border-l-4 border-blue-500 pl-2">Thông tin định danh (Identifiers)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {renderSingleSelect('Số Container', 'contractNo', true)}
                    {renderSingleSelect('Ngày (Date)', 'date', true)}
                    {renderSingleSelect('Số Bill (Bill No)', 'billNo')}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between border-l-4 border-green-500 pl-2">
                    <h4 className="text-sm font-bold text-gray-900">Các loại chi phí (Cost Categories)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderMultiSelect('Phí Hạ/Nâng', 'liftUnload')}
                    {renderMultiSelect('Cược Cont/Vỏ', 'containerDeposit')}
                    {renderMultiSelect('Phí Neo Xe', 'detentionFee')}
                    {renderMultiSelect('Phí Gửi Cont', 'storageFee')}
                    {renderMultiSelect('Phí Cầu Đường/BOT', 'toll')}
                    {renderMultiSelect('Cước Xe | PVC', 'transportFee')}
                    {renderMultiSelect('Chuyển Kho', 'warehouseTransfer')}
                    {renderMultiSelect('Phí Cân Xe', 'weighingFee')}
                    {renderMultiSelect('Phí Vệ Sinh', 'cleaningFee')}
                    {renderMultiSelect('Phí Quá Tải', 'overweightFee')}
                    {renderMultiSelect('Thuế (VAT)', 'vat')}
                    {/* Render Custom Costs */}
                    {mapping.additionalCosts && Object.keys(mapping.additionalCosts).map(costName => (
                        <div key={costName}>
                            {renderMultiSelectCustom(costName)}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};
