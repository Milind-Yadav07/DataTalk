'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { ChartConfig } from '../../types/chart';
import type { Row } from '../../types/dataset';
import { Loader2 } from 'lucide-react';

// Dynamically import all chart wrappers with SSR disabled as ECharts requires the window object
const BarChartWrapper = dynamic(() => import('../charts/BarChartWrapper'), { ssr: false });
const LineChartWrapper = dynamic(() => import('../charts/LineChartWrapper'), { ssr: false });
const AreaChartWrapper = dynamic(() => import('../charts/AreaChartWrapper'), { ssr: false });
const PieChartWrapper = dynamic(() => import('../charts/PieChartWrapper'), { ssr: false });
const ScatterChartWrapper = dynamic(() => import('../charts/ScatterChartWrapper'), { ssr: false });

interface ChartCanvasProps {
  config?: ChartConfig | null;
  data?: Row[] | null;
  isLoading?: boolean;
  containerId?: string;
}

export default function ChartCanvas({ config, data, isLoading, containerId }: ChartCanvasProps) {
  if (isLoading) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/20">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 text-slate-800 animate-spin" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Generating chart...</p>
        </div>
      </div>
    );
  }

  if (!config || !data || data.length === 0) {
    return (
      <div className="flex h-[350px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-950/20">
        <img
          src="/novisual.svg"
          alt="No Visualization"
          className="w-36 h-36 mb-4 object-contain"
        />
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">No Visualization</h3>
        <p className="mt-1 max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
          Ask a question or select columns to visualize the data.
        </p>
      </div>
    );
  }

  const renderChart = () => {
    switch (config.chartType) {
      case 'bar':
        return <BarChartWrapper config={config} data={data} />;
      case 'line':
        return <LineChartWrapper config={config} data={data} />;
      case 'area':
        return <AreaChartWrapper config={config} data={data} />;
      case 'pie':
        return <PieChartWrapper config={config} data={data} />;
      case 'scatter':
        return <ScatterChartWrapper config={config} data={data} />;
      default:
        return (
          <div className="flex h-[350px] w-full items-center justify-center rounded-xl bg-red-50 text-sm text-red-500 p-4 dark:bg-red-950/10">
            Unsupported chart type: {config.chartType}
          </div>
        );
    }
  };

  return (
    <div className="relative w-full">
      <div className="min-h-[350px] w-full" id={containerId || "chart-canvas-container"}>
        {renderChart()}
      </div>
    </div>
  );
}
