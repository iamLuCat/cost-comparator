import React, { useRef, useLayoutEffect } from 'react';
import { Layers } from 'lucide-react';
import { cn } from '../utils/cn';

export interface SheetOption {
    id: string;
    label: string;
}

interface SheetSelectorProps {
    options: SheetOption[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    label?: string;
    minHeight?: number;
    onHeightChange?: (height: number) => void;
}

export const SheetSelector: React.FC<SheetSelectorProps> = ({
    options,
    selectedIds,
    onChange,
    label = "Select Sheets",
    minHeight,
    onHeightChange
}) => {
    const toggleSheet = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(s => s !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const selectAll = () => {
        // Select all OPTIONS present in this selector (not necessarily all global options)
        const newIds = [...selectedIds];
        options.forEach(opt => {
            if (!newIds.includes(opt.id)) newIds.push(opt.id);
        });
        onChange(newIds);
    }

    const clearAll = () => {
        const idsToRemove = options.map(o => o.id);
        onChange(selectedIds.filter(id => !idsToRemove.includes(id)));
    }

    const contentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!contentRef.current || !onHeightChange) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                onHeightChange(entry.contentRect.height);
            }
        });

        observer.observe(contentRef.current);
        return () => observer.disconnect();
    }, [onHeightChange, options.length]);

    return (
        <div className="bg-gray-50 rounded-md border border-gray-100 p-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-400" />
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</h4>
                </div>
                <div className="flex gap-2 text-xs text-blue-600">
                    <button onClick={selectAll} className="hover:underline">Tất cả</button>
                    <button onClick={clearAll} className="hover:underline text-gray-400">Bỏ chọn</button>
                </div>
            </div>
            <div style={{ minHeight: minHeight ? `${minHeight}px` : undefined }} className="transition-[min-height] duration-200">
                <div ref={contentRef} className="flex flex-wrap gap-2">
                    {options.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => toggleSheet(opt.id)}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded border transition-colors",
                                selectedIds.includes(opt.id)
                                    ? "bg-blue-100 text-blue-700 border-blue-200 shadow-sm"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
