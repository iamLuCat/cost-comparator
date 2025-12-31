import { useState, useMemo, useEffect } from 'react';
import { ArrowRightLeft, PlayCircle, RefreshCw, Trash2, Plus } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { ColumnMapper } from './components/ColumnMapper';
import { SheetSelector } from './components/SheetSelector';
import { ResultsTable } from './components/ResultsTable';
import { AddCostModal } from './components/AddCostModal';
import { parseExcelFile } from './utils/excelParser';
import { compareBatchFiles } from './utils/comparator';
import { scanHeaders } from './utils/heuristicMapper';
import type { CostMapping, ComparisonResult, FileData } from './types';
import { cn } from './utils/cn';

const initialMapping: CostMapping = {
  contractNo: '',
  date: '',
  billNo: '',
  liftUnload: [],
  containerDeposit: [],
  toll: [],
  transportFee: [],
  freightCharge: [],
  warehouseTransfer: [],
  weighingFee: [],
  cleaningFee: [],
  overweightFee: [],
  detentionFee: [],
  storageFee: [],
  vat: [],
  additionalCosts: {}
};

function App() {
  const [filesA, setFilesA] = useState<FileData[]>([]);
  const [filesB, setFilesB] = useState<FileData[]>([]);

  // Map: FileName -> SheetNames[]
  const [selectedSheetsA, setSelectedSheetsA] = useState<string[]>([]);
  const [selectedSheetsB, setSelectedSheetsB] = useState<string[]>([]);

  const [mappingA, setMappingA] = useState<CostMapping>(initialMapping);
  const [mappingB, setMappingB] = useState<CostMapping>(initialMapping);

  const [results, setResults] = useState<ComparisonResult[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddCostModalOpen, setIsAddCostModalOpen] = useState(false);

  // Track heights of sheet selectors to synchronize them
  const [sheetHeights, setSheetHeights] = useState<Record<string, number>>({});

  const handleSheetHeightChange = (id: string, height: number) => {
    setSheetHeights(prev => {
      if (Math.abs((prev[id] || 0) - height) < 2) return prev; // Ignore small noise
      return { ...prev, [id]: height };
    });
  };

  const maxSheetHeight = useMemo(() => {
    const values = Object.values(sheetHeights);
    return values.length > 0 ? Math.max(...values) : undefined;
  }, [sheetHeights]);

  // Helper to get aggregated headers from all selected sheets of ALL files
  const getHeaders = (files: FileData[], selectedSheets: string[]) => {
    const allHeaders = new Set<string>();
    files.forEach(file => {
      file.sheets.forEach(sheet => {
        // Need to distinguish sheets if names collide? 
        // Ideally selectedSheets should be fully qualified: "FileName::SheetName"
        // For now, let's assume sheet names are unique enough or global selection.
        // Wait, previous design was simple string array for sheets.
        // With multiple files, sheet names might overlap (e.g. "Sheet1").
        // We should prefix sheet names in the selector? 
        // OR checks if it is in the list
        if (selectedSheets.includes(`${file.fileName}::${sheet.sheetName}`)) {
          sheet.headers.forEach(h => allHeaders.add(h));
        }
      });
    });
    return Array.from(allHeaders);
  };

  const headersA = useMemo(() => getHeaders(filesA, selectedSheetsA), [filesA, selectedSheetsA]);
  const headersB = useMemo(() => getHeaders(filesB, selectedSheetsB), [filesB, selectedSheetsB]);

  // Auto-run heuristics
  useEffect(() => {
    if (headersA.length > 0 && !mappingA.contractNo) {
      setMappingA(scanHeaders(headersA));
    }
  }, [headersA]);

  useEffect(() => {
    if (headersB.length > 0 && !mappingB.contractNo) {
      setMappingB(scanHeaders(headersB));
    }
  }, [headersB]);


  const handleFile = async (file: File, isFileA: boolean) => {
    try {
      const data = await parseExcelFile(file);
      if (isFileA) {
        setFilesA(prev => [...prev, data]);
        // Auto select DISABLED per user request
        // const newSheets = data.sheets.map(s => `${data.fileName}::${s.sheetName}`);
        // setSelectedSheetsA(prev => [...prev, ...newSheets]);
      } else {
        setFilesB(prev => [...prev, data]);
        // const newSheets = data.sheets.map(s => `${data.fileName}::${s.sheetName}`);
        // setSelectedSheetsB(prev => [...prev, ...newSheets]);
      }
    } catch (error) {
      alert('Error parsing file: ' + (error as Error).message);
    }
  };

  const removeFile = (fileName: string, isFileA: boolean) => {
    if (isFileA) {
      setFilesA(prev => prev.filter(f => f.fileName !== fileName));
      setSelectedSheetsA(prev => prev.filter(s => !s.startsWith(fileName + '::')));
    } else {
      setFilesB(prev => prev.filter(f => f.fileName !== fileName));
      setSelectedSheetsB(prev => prev.filter(s => !s.startsWith(fileName + '::')));
    }
    // Cleanup height tracking
    setSheetHeights(prev => {
      const key = `${isFileA ? 'A' : 'B'}_${fileName}`;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleCompare = () => {
    if (filesA.length === 0 || filesB.length === 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const res = compareBatchFiles(
          filesA,
          filesB,
          mappingA,
          mappingB,
          selectedSheetsA,
          selectedSheetsB
        );
        setResults(res);
      } catch (e) {
        alert('Error during comparison');
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  const handleReset = () => {
    setFilesA([]);
    setFilesB([]);
    setMappingA(initialMapping);
    setMappingB(initialMapping);
    setSelectedSheetsA([]);
    setSelectedSheetsB([]);
    setResults(null);
    setSheetHeights({});
  };

  const handleGlobalAddCost = (name: string, colsA: string[], colsB: string[]) => {
    // Update A
    setMappingA(prev => ({
      ...prev,
      additionalCosts: {
        ...(prev.additionalCosts || {}),
        [name]: colsA
      }
    }));

    // Update B
    setMappingB(prev => ({
      ...prev,
      additionalCosts: {
        ...(prev.additionalCosts || {}),
        [name]: colsB
      }
    }));
  };

  const isReadyToCompare = filesA.length > 0 && filesB.length > 0 &&
    mappingA.contractNo && mappingA.date &&
    mappingB.contractNo && mappingB.date;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 w-full mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">So Sánh Chi Phí</h1>
          </div>
          {results && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className="w-4 h-4" /> Làm mới
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT SIDE A */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">BÊN A</span>
                <h2 className="text-lg font-medium text-gray-900">Danh sách nguồn</h2>
              </div>
              <span className="text-xs text-gray-500">{filesA.length} file đã tải</span>
            </div>

            <FileUploader
              label="Thêm File vào Bên A"
              onFileSelect={(f) => handleFile(f, true)}
              onClear={() => { }}
              selectedFile={null} // Always clear input after selection
            />

            {/* File List A */}
            <div className="space-y-4">
              {filesA.map((f, i) => (
                <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300 bg-white border border-gray-200 rounded shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <span className="font-semibold text-gray-900 flex items-center gap-2">
                      {f.fileName}
                      <span className="text-xs text-gray-400 font-normal">({f.sheets.length} sheets)</span>
                    </span>
                    <button onClick={() => removeFile(f.fileName, true)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  {/* Per-file Sheet Selector */}
                  <SheetSelector
                    label="Chọn Sheet"
                    options={f.sheets.map(s => ({ id: `${f.fileName}::${s.sheetName}`, label: s.sheetName }))}
                    selectedIds={selectedSheetsA}
                    onChange={setSelectedSheetsA}
                    minHeight={maxSheetHeight}
                    onHeightChange={(h) => handleSheetHeightChange(`A_${f.fileName}`, h)}
                  />
                </div>
              ))}
            </div>

            {filesA.length > 0 && selectedSheetsA.length > 0 && (
              <div className="bg-white p-4 rounded border shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <ColumnMapper
                  title="Cấu hình Cột (Bên A)"
                  headers={headersA}
                  mapping={mappingA}
                  onChange={setMappingA}
                />
              </div>
            )}

            {filesA.length > 0 && selectedSheetsA.length === 0 && (
              <div className="p-4 bg-yellow-50 text-yellow-700 text-sm rounded border border-yellow-200">
                ⚠ Vui lòng chọn ít nhất một sheet để cấu hình cột.
              </div>
            )}
          </div>

          {/* RIGHT SIDE B */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">BÊN B</span>
                <h2 className="text-lg font-medium text-gray-900">Danh sách đối chiếu</h2>
              </div>
              <span className="text-xs text-gray-500">{filesB.length} file đã tải</span>
            </div>

            <FileUploader
              label="Thêm File vào Bên B"
              onFileSelect={(f) => handleFile(f, false)}
              onClear={() => { }}
              selectedFile={null}
            />

            <div className="space-y-4">
              {filesB.map((f, i) => (
                <div key={i} className="animate-in fade-in slide-in-from-right-2 duration-300 bg-white border border-gray-200 rounded shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <span className="font-semibold text-gray-900 flex items-center gap-2">
                      {f.fileName}
                      <span className="text-xs text-gray-400 font-normal">({f.sheets.length} sheets)</span>
                    </span>
                    <button onClick={() => removeFile(f.fileName, false)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>

                  <SheetSelector
                    label="Chọn Sheet"
                    options={f.sheets.map(s => ({ id: `${f.fileName}::${s.sheetName}`, label: s.sheetName }))}
                    selectedIds={selectedSheetsB}
                    onChange={setSelectedSheetsB}
                    minHeight={maxSheetHeight}
                    onHeightChange={(h) => handleSheetHeightChange(`B_${f.fileName}`, h)}
                  />
                </div>
              ))}
            </div>

            {filesB.length > 0 && selectedSheetsB.length > 0 && (
              <div className="bg-white p-4 rounded border shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <ColumnMapper
                  title="Cấu hình Cột (Bên B)"
                  headers={headersB}
                  mapping={mappingB}
                  onChange={setMappingB}
                />
              </div>
            )}

            {filesB.length > 0 && selectedSheetsB.length === 0 && (
              <div className="p-4 bg-yellow-50 text-yellow-700 text-sm rounded border border-yellow-200">
                ⚠ Vui lòng chọn ít nhất một sheet để cấu hình cột.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 py-8">
          <button
            onClick={() => setIsAddCostModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Thêm Chi Phí
          </button>

          <button
            onClick={handleCompare}
            disabled={!isReadyToCompare || isProcessing}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-full text-lg font-semibold shadow-md transition-all transform hover:-translate-y-0.5",
              isReadyToCompare && !isProcessing
                ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {isProcessing ? "Đang xử lý..." : <><PlayCircle className="w-6 h-6" /> So Sánh Ngay</>}
          </button>
        </div>

        {results && <ResultsTable results={results} mappingA={mappingA} mappingB={mappingB} />}
      </main>

      <AddCostModal
        isOpen={isAddCostModalOpen}
        onClose={() => setIsAddCostModalOpen(false)}
        onAdd={handleGlobalAddCost}
        headersA={headersA}
        headersB={headersB}
        mappingA={mappingA}
        mappingB={mappingB}
        filesA={filesA}
        filesB={filesB}
      />
    </div>
  );
}



export default App;
