import React, { useState, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import type { CostMapping, FileData } from '../types';

interface AddCostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string, colsA: string[], colsB: string[]) => void;
    headersA: string[];
    headersB: string[];
    mappingA: CostMapping;
    mappingB: CostMapping;
    filesA: FileData[];
    filesB: FileData[];
}

const getUsedColumns = (mapping: CostMapping | undefined): Set<string> => {
    const used = new Set<string>();
    if (!mapping) return used;
    const { contractNo, date, billNo, additionalCosts, ...rest } = mapping;
    if (contractNo) used.add(contractNo);
    if (date) used.add(date);
    if (billNo) used.add(billNo);
    if (rest) {
        Object.values(rest).forEach(val => {
            if (Array.isArray(val)) val.forEach(v => used.add(v));
        });
    }
    if (additionalCosts) {
        Object.values(additionalCosts).forEach(cols => {
            if (Array.isArray(cols)) cols.forEach(c => used.add(c));
        });
    }
    return used;
};

// Helper: Convert "H" -> 7, "AA" -> 26
const colLetterToIdx = (letter: string): number => {
    let column = 0;
    const length = letter.length;
    for (let i = 0; i < length; i++) {
        column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
    }
    return column - 1; // 0-based
};

const parseAddress = (addr: string) => {
    const match = addr.toUpperCase().trim().match(/^([A-Z]+)([0-9]+)$/);
    if (!match) return null;
    return {
        c: colLetterToIdx(match[1]),
        r: parseInt(match[2], 10)
    };
};

export const AddCostModal: React.FC<AddCostModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    headersA,
    headersB,
    mappingA,
    mappingB,
    filesA,
    filesB
}) => {
    const [name, setName] = useState('');
    const [selectedA, setSelectedA] = useState<string[]>([]);
    const [selectedB, setSelectedB] = useState<string[]>([]);
    const [searchTermA, setSearchTermA] = useState('');
    const [searchTermB, setSearchTermB] = useState('');
    const [addressInput, setAddressInput] = useState('');

    const usedA = useMemo(() => getUsedColumns(mappingA), [mappingA]);
    const usedB = useMemo(() => getUsedColumns(mappingB), [mappingB]);

    if (!isOpen) return null;

    const resolveHeadersFromAddresses = (input: string, files: FileData[]): string[] => {
        const found = new Set<string>();
        // Split by colon, comma or space
        const addresses = input.split(/[:,\s]+/).filter(s => !!s);

        addresses.forEach(addr => {
            const parsed = parseAddress(addr);
            if (!parsed) return;

            // Search in files
            for (const file of files) {
                for (const sheet of file.sheets) {
                    // Check if this sheet's header row matches user request
                    // parsed.r is 1-based row from Excel
                    // sheet.headerRowIndex is 1-based header position
                    // Default to 1 if undefined
                    const headerRow = sheet.headerRowIndex || 1;

                    if (headerRow === parsed.r) {
                        const val = sheet.headers[parsed.c];
                        if (val) {
                            found.add(val);
                            // Found a match in this file, maybe stop? 
                            // But maybe other files have different headers at same pos?
                            // Let's collect all unique matches.
                        }
                    }
                }
            }
        });
        return Array.from(found);
    };

    const handleAddressLookup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setAddressInput(val);

        // Auto-select based on input
        if (val.trim()) {
            const foundA = resolveHeadersFromAddresses(val, filesA);
            const foundB = resolveHeadersFromAddresses(val, filesB);

            // Merge with existing manual selections? 
            // Or just override? The user might type "H1", get "Cost", then type "K1", get "Tax".
            // Ideally we want to accumulate if they type multiple "H1:K1".

            // Current strategy: If input is present, we try to sync selection to it + manual actions?
            // Simpler: Just add found ones to selection if not present.
            // But we don't want to clear manual clicks.
            // Let's just add found ones.

            setSelectedA(prev => Array.from(new Set([...prev, ...foundA])));
            setSelectedB(prev => Array.from(new Set([...prev, ...foundB])));
        }
    };

    const handleAdd = () => {
        if (!name.trim()) return;
        onAdd(name.trim(), selectedA, selectedB);
        setName('');
        setSelectedA([]);
        setSelectedB([]);
        setAddressInput('');
        onClose();
    };

    const toggleSelection = (
        item: string,
        current: string[],
        setFn: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        if (current.includes(item)) {
            setFn(current.filter(i => i !== item));
        } else {
            setFn([...current, item]);
        }
    };

    // ... renderColumnList helper (unchanged) ...
    const renderColumnList = (
        headers: string[],
        selected: string[],
        setFn: React.Dispatch<React.SetStateAction<string[]>>,
        searchTerm: string,
        setSearchTerm: (s: string) => void,
        title: string,
        usedSet: Set<string>
    ) => (
        <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{title}</label>
            <input
                type="text"
                placeholder="Tìm cột..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded mb-1 p-1"
            />
            <div className="border border-gray-200 rounded h-40 overflow-y-auto bg-gray-50 p-1 space-y-0.5">
                {Array.isArray(headers) && headers
                    .filter(h => {
                        if (typeof h !== 'string') return false;
                        return !usedSet?.has(h) && h.toLowerCase().includes((searchTerm || '').toLowerCase());
                    })
                    .map(h => {
                        const isSelected = selected.includes(h);
                        return (
                            <div
                                key={h}
                                onClick={() => toggleSelection(h, selected, setFn)}
                                className={`
                                    flex items-center justify-between px-2 py-1.5 rounded cursor-pointer text-sm
                                    ${isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}
                                `}
                            >
                                <span className="truncate" title={h}>{h}</span>
                                {isSelected && <Check className="w-3 h-3" />}
                            </div>
                        );
                    })}
            </div>
            <div className="text-xs text-gray-400 mt-1 h-4">
                {selected.length > 0 ? `${selected.length} cột được chọn` : ''}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">Thêm Chi Phí Mới</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên loại chi phí <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ví dụ: Phí bốc xếp, Phí vệ sinh..."
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tìm nhanh bằng vị trí ô (Excel)
                        </label>
                        <input
                            type="text"
                            value={addressInput}
                            onChange={handleAddressLookup}
                            placeholder="Ví dụ: H1, K2, F5 (nhập để tự động chọn cột tương ứng)"
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-blue-50/30"
                        />
                        <p className="text-xs text-gray-400 mt-1">Nhập tọa độ ô chứa tiêu đề trong file Excel để tự động tìm.</p>
                    </div>

                    <div className="flex gap-4 flex-wrap">
                        {renderColumnList(headersA, selectedA, setSelectedA, searchTermA, setSearchTermA, "Cột bên A", usedA)}
                        {renderColumnList(headersB, selectedB, setSelectedB, searchTermB, setSearchTermB, "Cột bên B", usedB)}
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={!name.trim()}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                    >
                        Thêm Chi Phí
                    </button>
                </div>
            </div>
        </div>
    );
};
