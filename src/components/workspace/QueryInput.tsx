'use client';

import React, { useState, useEffect } from 'react';
import { Send, Sparkles, MessageSquare } from 'lucide-react';
import type { Column } from '../../types/dataset';

interface QueryInputProps {
  onSendQuery: (query: string) => void;
  isQuerying: boolean;
  columns: Column[];
}

export default function QueryInput({
  onSendQuery,
  isQuerying,
  columns,
}: QueryInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Generate dynamic suggestions based on the columns
  useEffect(() => {
    if (!columns || columns.length === 0) return;

    const numCols = columns.filter((c) => c.type === 'number').map((c) => c.name);
    const catCols = columns.filter((c) => c.type === 'string' || c.type === 'boolean').map((c) => c.name);
    const dateCols = columns.filter((c) => c.type === 'date').map((c) => c.name);

    const generated: string[] = [];

    // Fallbacks
    const dateCol = dateCols[0] || catCols[0] || columns[0].name;
    const catCol = catCols[0] || columns[0].name;
    const numCol = numCols[0] || (columns[1] ? columns[1].name : columns[0].name);

    if (numCols.length > 0 && catCols.length > 0) {
      generated.push(`Show total ${numCol} by ${catCol}`);
      generated.push(`What is the average ${numCol} grouped by ${catCol}?`);
    } else {
      generated.push(`Summarize the dataset by ${columns[0].name}`);
    }

    if (dateCols.length > 0 && numCols.length > 0) {
      generated.push(`Compare ${numCol} over time by ${dateCol}`);
    } else if (columns.length >= 2) {
      generated.push(`Plot ${numCol} against ${dateCol}`);
    }

    if (numCols.length >= 2) {
      generated.push(`Show correlation between ${numCols[0]} and ${numCols[1]}`);
    }

    setSuggestions(generated.slice(0, 3));
  }, [columns]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isQuerying) return;
    onSendQuery(query.trim());
    setQuery('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isQuerying) return;
    onSendQuery(suggestion);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-none p-4 space-y-4">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-[#86BC25]" />
            <span>Try asking:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isQuerying}
                className="text-xs bg-slate-50 hover:bg-[#86BC25]/10 border border-slate-200 hover:border-[#86BC25]/30 text-slate-600 hover:text-slate-900 py-1.5 px-3 rounded-none transition-all text-left truncate max-w-xs sm:max-w-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <MessageSquare className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isQuerying}
            placeholder={
              isQuerying
                ? 'Generating visualization configuration...'
                : 'Ask a question about this dataset (e.g. "What is the average sales by region?")'
            }
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#86BC25] focus:bg-white text-slate-800 placeholder-slate-400 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-[#86BC25]/20 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={!query.trim() || isQuerying}
          className="shrink-0 bg-slate-900 border border-slate-900 hover:bg-[#86BC25] hover:border-[#86BC25] hover:text-slate-950 disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-400 text-white rounded-none p-3.5 shadow-xs disabled:shadow-none transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          title="Send query"
        >
          {isQuerying ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  );
}
