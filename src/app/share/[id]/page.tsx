'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Share2 } from 'lucide-react';
import ChartCanvas from '@/components/workspace/ChartCanvas';

export default function SharePage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col">
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/10">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Shared Insights</h1>
            <p className="text-xs text-slate-500">Viewing shared analysis: {id}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Shared Visualization</h2>
            <p className="text-sm text-slate-500">Interactive data visualization shared with you.</p>
          </div>
          <ChartCanvas isLoading={false} config={null} data={null} />
        </div>
      </main>
    </div>
  );
}
