import React from 'react';
import { Layers } from 'lucide-react';
import { cn } from '../utils/cn';

interface SheetSelectorProps {
    sheets: string[];
    selectedSheets: string[];
    onChange: (sheets: string[]) => void;
}

export const SheetSelector: React.FC<SheetSelectorProps> = ({
    sheets,
    selectedSheets,
    onChange
}) => {
    const toggleSheet = (sheet: string) => {
        if (selectedSheets.includes(sheet)) {
            onChange(selectedSheets.filter(s => s !== sheet));
        } else {
            onChange([...selectedSheets, sheet]);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
                <Layers className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-800">Select Sheets to Include</h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {sheets.map(sheet => (
                    <button
                        key={sheet}
                        onClick={() => toggleSheet(sheet)}
                        className={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-full border transition-colors",
                            selectedSheets.includes(sheet)
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        )}
                    >
                        {sheet}
                    </button>
                ))}
            </div>
            {selectedSheets.length === 0 && (
                <p className="text-xs text-red-500 mt-2">Please select at least one sheet.</p>
            )}
        </div>
    );
};
