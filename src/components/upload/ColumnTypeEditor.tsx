'use client';

import React from 'react';
import type { Column, ColumnType } from '../../types/dataset';
import { Type, Hash, Calendar, CheckSquare } from 'lucide-react';

interface ColumnTypeEditorProps {
  columns: Column[];
  onTypeChange: (colIndex: number, newType: ColumnType) => void;
}

const TYPE_ICONS: Record<ColumnType, any> = {
  string: Type,
  number: Hash,
  date: Calendar,
  boolean: CheckSquare,
};

const TYPE_LABELS: Record<ColumnType, string> = {
  string: 'Text',
  number: 'Number',
  date: 'Date',
  boolean: 'Boolean',
};

export default function ColumnTypeEditor({ columns, onTypeChange }: ColumnTypeEditorProps) {
  return (
    <div className="overflow-hidden border border-slate-200 rounded-lg bg-white shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">Schema & Column Types</h3>
        <p className="text-xs text-slate-500">Verify and adjust the data types inferred for each column.</p>
      </div>
      <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
        {columns.map((col, index) => {
          const Icon = TYPE_ICONS[col.type] || Type;
          return (
            <div key={col.name} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex-1 min-w-0 pr-4">
                <span className="text-sm font-semibold text-slate-800 block truncate" title={col.name}>
                  {col.name}
                </span>
                <span className="text-xs text-slate-400 block truncate mt-0.5">
                  Sample: {col.sampleValues.length > 0 ? col.sampleValues.join(', ') : 'None'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-slate-400" />
                <select
                  value={col.type}
                  onChange={(e) => onTypeChange(index, e.target.value as ColumnType)}
                  className="text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md py-1.5 px-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all"
                >
                  {(Object.keys(TYPE_LABELS) as ColumnType[]).map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
