'use client';

import React from 'react';
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react';

interface InsightBubbleProps {
  insight: string | null;
  query: string;
  isLoading: boolean;
}

export default function InsightBubble({
  insight,
  query,
  isLoading,
}: InsightBubbleProps) {
  // Simple custom Markdown formatter for bold text and list items
  const formatInsightText = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Check if it's a bullet point
      const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
      let content = trimmed;
      if (isBullet) {
        content = trimmed.substring(2);
      }

      // Replace bold syntax **text** with <strong> elements
      const parts = content.split('**');
      const formattedContent = parts.map((part, partIdx) => {
        // Odd index parts are wrapped in **
        if (partIdx % 2 !== 0) {
          return <strong key={partIdx} className="font-extrabold text-slate-950">{part}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc pl-1 text-slate-700 text-xs sm:text-sm leading-relaxed mb-2">
            {formattedContent}
          </li>
        );
      }

      return (
        <p key={idx} className="text-slate-700 text-xs sm:text-sm leading-relaxed mb-3">
          {formattedContent}
        </p>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="bg-[#86BC25]/5 border border-[#86BC25]/20 rounded-2xl p-5 shadow-sm space-y-3 animate-pulse">
        <div className="flex items-center gap-2 text-slate-800">
          <Sparkles className="h-4.5 w-4.5 text-[#86BC25] animate-spin" />
          <div className="h-4 w-24 bg-[#86BC25]/20 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-200 rounded" />
          <div className="h-3 w-5/6 bg-slate-200 rounded" />
          <div className="h-3 w-4/5 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="bg-gradient-to-tr from-[#86BC25]/8 to-[#86BC25]/3 border border-[#86BC25]/20 rounded-2xl p-5 space-y-4 transition-all duration-300">
      {/* Insight Header */}
      <div className="flex items-center justify-between border-b border-[#86BC25]/15 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800">
          <Sparkles className="h-4.5 w-4.5 text-[#86BC25] fill-[#86BC25]/20" />
          <span className="font-bold text-sm tracking-wide">AI Analysis</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Derived from visualization</span>
        </div>
      </div>

      {/* Query Context */}
      <div className="text-xs bg-white/70 border border-slate-100 px-3 py-2 rounded-lg text-slate-600 flex items-start gap-1.5">
        <AlertCircle className="h-3.5 w-3.5 text-[#86BC25] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Analysing: </span>
          <span className="italic">"{query}"</span>
        </div>
      </div>

      {/* Insight Content */}
      <div className="text-slate-800 pr-1 select-text">
        {formatInsightText(insight)}
      </div>
    </div>
  );
}
