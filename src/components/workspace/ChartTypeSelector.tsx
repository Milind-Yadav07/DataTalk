'use client';

import React from 'react';
import { BarChart2, LineChart, PieChart, TrendingUp, ScatterChart } from 'lucide-react';
import type { ChartType } from '../../types/chart';

interface ChartTypeSelectorProps {
  currentType: ChartType;
  onChange: (type: ChartType) => void;
  disabled?: boolean;
}

export default function ChartTypeSelector({
  currentType,
  onChange,
  disabled = false,
}: ChartTypeSelectorProps) {
  const types: Array<{ type: ChartType; label: string; icon: React.ReactNode }> = [
    {
      type: 'bar',
      label: 'Bar',
      icon: <BarChart2 className="h-4 w-4" />,
    },
    {
      type: 'line',
      label: 'Line',
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      type: 'area',
      label: 'Area',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      type: 'pie',
      label: 'Pie',
      icon: <PieChart className="h-4 w-4" />,
    },
    {
      type: 'scatter',
      label: 'Scatter',
      icon: <ScatterChart className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-none border border-slate-200/50 backdrop-blur-sm self-start">
      {types.map(({ type, label, icon }) => {
        const isActive = currentType === type;
        return (
          <button
            key={type}
            onClick={() => !disabled && onChange(type)}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-semibold transition-all ${
              isActive
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/40 font-bold'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 disabled:opacity-50 disabled:pointer-events-none'
            } cursor-pointer`}
          >
            <span className={isActive ? 'text-[#86BC25]' : 'text-slate-400'}>
              {icon}
            </span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
