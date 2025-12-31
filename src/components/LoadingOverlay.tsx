import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    isLoading: boolean;
    message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message = "Đang xử lý..." }) => {
    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4 min-w-[200px]">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-600 font-medium text-sm animate-pulse">{message}</p>
            </div>
        </div>
    );
};
