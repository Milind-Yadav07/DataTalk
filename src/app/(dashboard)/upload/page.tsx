'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, ArrowLeft, Loader2, Database } from 'lucide-react';
import FileDropzone from '@/components/upload/FileDropzone';
import ColumnTypeEditor from '@/components/upload/ColumnTypeEditor';
import DataPreviewTable from '@/components/upload/DataPreviewTable';
import { parseCSV } from '@/lib/parsers/csvParser';
import { parseExcel } from '@/lib/parsers/excelParser';
import type { Dataset, ColumnType } from '@/types/dataset';

export default function UploadPage() {
  const router = useRouter();
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataset, setDataset] = useState<Dataset | null>(null);

  const handleFileSelected = async (file: File) => {
    setIsParsing(true);
    setError(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let parsed: Dataset;
      if (ext === 'csv') {
        parsed = await parseCSV(file);
      } else {
        parsed = await parseExcel(file);
      }
      setDataset(parsed);
    } catch (err: any) {
      setError(err?.message || 'Failed to parse file. Please verify it is not corrupted.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleTypeChange = (colIndex: number, newType: ColumnType) => {
    if (!dataset) return;
    const updatedColumns = [...dataset.columns];
    updatedColumns[colIndex] = {
      ...updatedColumns[colIndex],
      type: newType,
    };
    
    // Cast/update rows to match the new type
    const updatedRows = dataset.rows.map((row) => {
      const updatedRow = { ...row };
      const colName = updatedColumns[colIndex].name;
      const rawVal = row[colName];
      
      if (rawVal === null || rawVal === undefined || rawVal === '') {
        updatedRow[colName] = null;
      } else if (newType === 'number') {
        updatedRow[colName] = isNaN(Number(rawVal)) ? null : Number(rawVal);
      } else if (newType === 'boolean') {
        const lower = String(rawVal).toLowerCase();
        updatedRow[colName] = lower === 'true' || lower === 'yes' || lower === '1';
      } else {
        updatedRow[colName] = String(rawVal);
      }
      return updatedRow;
    });

    setDataset({
      ...dataset,
      columns: updatedColumns,
      rows: updatedRows,
    });
  };

  const handleSave = async () => {
    if (!dataset) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dataset.name,
          fileName: dataset.fileName,
          columns: dataset.columns,
          rowCount: dataset.rowCount,
          rows: dataset.rows,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save dataset');
      }

      const saved = await res.json();
      const datasetId = saved.id || saved._id;
      localStorage.setItem('activeWorkspaceId', datasetId);
      router.push('/workspace');
    } catch (err: any) {
      setError(err?.message || 'Error occurred while saving your dataset.');
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setDataset(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Upload your <span className="underline decoration-[#86BC25] decoration-4 underline-offset-8">Dataset</span>
          </h1>
          <p className="text-slate-500 mt-4">
            Upload a CSV or Excel file to automatically parse, clean, and visualize your data.
          </p>
        </div>
        {dataset && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Upload a different file
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3">
          <div className="h-9 w-9 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            ⚠️
          </div>
          <div>
            <p className="text-sm font-semibold">Error processing request</p>
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {isParsing ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] border border-slate-100 rounded-xl bg-white shadow-sm p-12 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-800 mb-4 shadow-inner border border-slate-100">
            <Loader2 className="h-8 w-8 text-slate-800 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Processing Dataset</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Analyzing columns, detecting schemas, and preparing table structures...
          </p>
        </div>
      ) : !dataset ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] pt-12">
          <div className="max-w-xl w-full bg-white border border-slate-200 rounded-none p-10 shadow-sm text-center">
            <div className="flex items-center justify-center gap-3.5 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#86BC25] text-white shadow-md shadow-[#86BC25]/30 shrink-0">
                <Upload className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Upload your Dataset</h2>
            </div>
            <FileDropzone onFileSelected={handleFileSelected} />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column Editor - 2 columns on lg */}
            <div className="lg:col-span-2">
              <ColumnTypeEditor columns={dataset.columns} onTypeChange={handleTypeChange} />
            </div>

            {/* File Info and Submit - 1 column on lg */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">Dataset Summary</h3>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">File Name</span>
                    <span className="font-medium text-slate-800 truncate max-w-[160px]" title={dataset.fileName}>
                      {dataset.fileName}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">Total Rows</span>
                    <span className="font-semibold text-slate-800">{dataset.rowCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">Total Columns</span>
                    <span className="font-semibold text-slate-800">{dataset.columns.length}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving dataset...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        Save & Start Analyzing
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <DataPreviewTable columns={dataset.columns} rows={dataset.rows} />
        </div>
      )}
    </div>
  );
}

