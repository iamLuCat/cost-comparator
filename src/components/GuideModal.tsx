import React from 'react';
import { X, BookOpen, FileText, CheckCircle, Search, Filter, ArrowUp } from 'lucide-react';

interface GuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-2 text-blue-700">
                        <BookOpen className="w-6 h-6" />
                        <h2 className="text-xl font-bold">Hướng Dẫn Sử Dụng</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-0 overflow-y-auto custom-scrollbar">
                    <div className="p-6 space-y-8">
                        {/* Section 1 */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold">1</span>
                                Chuẩn Bị File Excel
                            </h3>
                            <div className="ml-10 bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-gray-700">
                                <p className="mb-2">Để tool hoạt động chính xác, file Excel cần:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li><strong>Dòng tiêu đề:</strong> Chứa tên các cột (Ví dụ: <em>Số Container, Phí THC...</em>).</li>
                                    <li><strong>Dữ liệu:</strong> Nằm ngay dưới dòng tiêu đề.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold">2</span>
                                Quy Trình Đối Chiếu
                            </h3>
                            <div className="ml-10 space-y-6 border-l-2 border-gray-100 pl-6 relative">
                                {/* Step 2.1 */}
                                <div className="relative">
                                    <div className="absolute -left-[31px] top-0 bg-white border-2 border-gray-200 w-4 h-4 rounded-full"></div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Bước 1: Tải File Lên</h4>
                                    <p className="text-sm text-gray-600 mb-2">Upload file Excel cho <strong>Bên A</strong> (Nội bộ) và <strong>Bên B</strong> (Đối tác/Hãng tàu).</p>
                                </div>

                                {/* Step 2.2 */}
                                <div className="relative">
                                    <div className="absolute -left-[31px] top-0 bg-white border-2 border-gray-200 w-4 h-4 rounded-full"></div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Bước 2: Kiểm Tra Mapping (Quan Trọng)</h4>
                                    <p className="text-sm text-gray-600 mb-2">Tool sẽ tự động nhận diện cột. Bạn cần kiểm tra lại:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-3 rounded border">
                                            <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Cột Định Danh</span>
                                            <ul className="text-sm space-y-1">
                                                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Số Container (Bắt buộc)</li>
                                                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-500" /> Ngày tháng</li>
                                            </ul>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded border">
                                            <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Cột Chi Phí</span>
                                            <p className="text-sm text-gray-600">Kiểm tra các ô như <em>Phí nâng hạ, Vệ sinh...</em> đã chọn đúng cột chưa.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2.3 */}
                                <div className="relative">
                                    <div className="absolute -left-[31px] top-0 bg-white border-2 border-gray-200 w-4 h-4 rounded-full"></div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Bước 3: Thêm Chi Phí Khác (Nếu cần)</h4>
                                    <p className="text-sm text-gray-600 mb-2">Nếu thiếu cột chi phí (VD: Phí Seal), nhấn nút <strong>"+ Thêm Chi Phí"</strong>.</p>
                                    <div className="bg-yellow-50 p-3 rounded border border-yellow-100 text-sm text-yellow-800">
                                        <strong>Mẹo:</strong> Nhập vị trí ô Excel vào ô tìm kiếm (VD: <code>H1</code>, <code>K3</code>) để tìm nhanh tên cột.
                                    </div>
                                </div>

                                {/* Step 2.4 */}
                                <div className="relative">
                                    <div className="absolute -left-[31px] top-0 bg-white border-2 border-gray-200 w-4 h-4 rounded-full"></div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Bước 4: So Sánh</h4>
                                    <p className="text-sm text-gray-600">Nhấn nút <strong>"So Sánh Ngay"</strong> để xem kết quả.</p>
                                </div>
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section>
                            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold">3</span>
                                Xem Kết Quả
                            </h3>
                            <div className="ml-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                <div className="border rounded p-3 text-center">
                                    <span className="text-green-600 font-bold block">KHỚP</span>
                                    <span className="text-xs text-gray-500">Chi phí 2 bên bằng nhau</span>
                                </div>
                                <div className="border rounded p-3 text-center">
                                    <span className="text-red-600 font-bold block">LỆCH</span>
                                    <span className="text-xs text-gray-500">Chi phí khác nhau</span>
                                </div>
                                <div className="border rounded p-3 text-center">
                                    <span className="text-yellow-600 font-bold block">THIẾU</span>
                                    <span className="text-xs text-gray-500">Chỉ có ở 1 bên</span>
                                </div>
                            </div>
                            <div className="ml-10 space-y-2 text-sm text-gray-600">
                                <p className="flex items-center gap-2"><Filter className="w-4 h-4" /> <strong>Lọc:</strong> Xem riêng các container Lệch/Thiếu.</p>
                                <p className="flex items-center gap-2"><Search className="w-4 h-4" /> <strong>Tìm kiếm:</strong> Nhập số container để tra cứu.</p>
                                <p className="flex items-center gap-2"><FileText className="w-4 h-4" /> <strong>Chi tiết:</strong> Click vào dòng để xem chi tiết từng khoản phí.</p>
                                <p className="flex items-center gap-2"><ArrowUp className="w-4 h-4" /> <strong>Sắp xếp:</strong> Click vào tiêu đề cột để sắp xếp.</p>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm">
                        Đã Hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};
