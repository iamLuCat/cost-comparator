import { useState, useMemo, useEffect } from 'react';
import { ArrowRightLeft, FileSpreadsheet, PlayCircle, RefreshCw } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { ColumnMapper } from './components/ColumnMapper';
import { SheetSelector } from './components/SheetSelector';
import { ResultsTable } from './components/ResultsTable';
import { parseExcelFile } from './utils/excelParser';
import { compareFiles } from './utils/comparator';
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
  warehouseTransfer: []
};

function App() {
  const [fileA, setFileA] = useState<FileData | null>(null);
  const [fileB, setFileB] = useState<FileData | null>(null);

  const [selectedSheetsA, setSelectedSheetsA] = useState<string[]>([]);
  const [selectedSheetsB, setSelectedSheetsB] = useState<string[]>([]);

  const [mappingA, setMappingA] = useState<CostMapping>(initialMapping);
  const [mappingB, setMappingB] = useState<CostMapping>(initialMapping);

  const [results, setResults] = useState<ComparisonResult[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to get aggregated headers from all selected sheets (Union)
  const getHeaders = (file: FileData | null, selectedSheets: string[]) => {
    if (!file) return [];
    const allHeaders = new Set<string>();
    file.sheets.forEach(sheet => {
      if (selectedSheets.includes(sheet.sheetName)) {
        sheet.headers.forEach(h => allHeaders.add(h));
      }
    });
    return Array.from(allHeaders);
  };

  const headersA = useMemo(() => getHeaders(fileA, selectedSheetsA), [fileA, selectedSheetsA]);
  const headersB = useMemo(() => getHeaders(fileB, selectedSheetsB), [fileB, selectedSheetsB]);

  // Auto-run heuristics when headers change
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
        setFileA(data);
        // Default select all sheets? Or just first? Let's select all.
        setSelectedSheetsA(data.sheets.map(s => s.sheetName));
      } else {
        setFileB(data);
        setSelectedSheetsB(data.sheets.map(s => s.sheetName));
      }
    } catch (error) {
      alert('Error parsing file: ' + (error as Error).message);
    }
  };

  const handleCompare = () => {
    if (!fileA || !fileB) return;
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const res = compareFiles(
          fileA,
          fileB,
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
    setFileA(null);
    setFileB(null);
    setMappingA(initialMapping);
    setMappingB(initialMapping);
    setSelectedSheetsA([]);
    setSelectedSheetsB([]);
    setResults(null);
  };

  const isReadyToCompare = fileA && fileB &&
    mappingA.contractNo && mappingA.date &&
    mappingB.contractNo && mappingB.date &&
    selectedSheetsA.length > 0 && selectedSheetsB.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Cost Comparator Pro</h1>
          </div>
          {results && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className="w-4 h-4" /> Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Setup Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Side: File A */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">FILE A</span>
              <h2 className="text-lg font-medium text-gray-900">Source File</h2>
            </div>

            <FileUploader
              label="Upload File A"
              selectedFile={fileA ? { name: fileA.fileName, size: 0 } as File : null}
              onFileSelect={(f) => handleFile(f, true)}
              onClear={() => setFileA(null)}
            />

            {fileA && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
                <SheetSelector
                  sheets={fileA.sheets.map(s => s.sheetName)}
                  selectedSheets={selectedSheetsA}
                  onChange={setSelectedSheetsA}
                />

                {selectedSheetsA.length > 0 && (
                  <ColumnMapper
                    title="Map Columns for File A"
                    headers={headersA}
                    mapping={mappingA}
                    onChange={setMappingA}
                  />
                )}
              </div>
            )}
          </div>

          {/* Right Side: File B */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">FILE B</span>
              <h2 className="text-lg font-medium text-gray-900">Target File</h2>
            </div>

            <FileUploader
              label="Upload File B"
              selectedFile={fileB ? { name: fileB.fileName, size: 0 } as File : null}
              onFileSelect={(f) => handleFile(f, false)}
              onClear={() => setFileB(null)}
            />

            {fileB && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
                <SheetSelector
                  sheets={fileB.sheets.map(s => s.sheetName)}
                  selectedSheets={selectedSheetsB}
                  onChange={setSelectedSheetsB}
                />
                {selectedSheetsB.length > 0 && (
                  <ColumnMapper
                    title="Map Columns for File B"
                    headers={headersB}
                    mapping={mappingB}
                    onChange={setMappingB}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Section */}
        <div className="flex justify-center py-4">
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
            {isProcessing ? (
              <>Processing...</>
            ) : (
              <>
                <PlayCircle className="w-6 h-6" /> Compare Files
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {results && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
              <FileSpreadsheet className="w-6 h-6 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900">Comparison Results</h2>
            </div>

            <ResultsTable results={results} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
