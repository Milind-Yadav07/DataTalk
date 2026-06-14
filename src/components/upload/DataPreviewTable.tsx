'use client';

import React from 'react';
import type { Column, Row } from '../../types/dataset';

interface DataPreviewTableProps {
  columns: Column[];
  rows: Row[];
  maxRows?: number;
}

export default function DataPreviewTable({ columns, rows, maxRows = 5 }: DataPreviewTableProps) {
  const previewRows = rows.slice(0, maxRows);

  return (
    <div className="overflow-hidden border border-slate-200 rounded-lg bg-white shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">Data Preview</h3>
        <p className="text-xs text-slate-500">Previewing the first {previewRows.length} rows of your dataset.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50/75">
            <tr>
              {columns.map((col) => (
                <th key={col.name} className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {previewRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
                {columns.map((col) => {
                  const val = row[col.name];
                  return (
                    <td key={col.name} className="px-4 py-2.5 text-slate-600 whitespace-nowrap max-w-[200px] truncate">
                      {val === null || val === undefined ? (
                        <span className="text-slate-300 italic">null</span>
                      ) : typeof val === 'boolean' ? (
                        val ? 'True' : 'False'
                      ) : (
                        String(val)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
