'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '../../../store/hooks';
import { setActiveDataset, clearWorkspace } from '../../../store/slices/workspaceSlice';
import { transformDataForChart } from '@/lib/utils/dataTransform';
import ChartCanvas from '@/components/workspace/ChartCanvas';
import ChartTypeSelector from '@/components/workspace/ChartTypeSelector';
import QueryInput from '@/components/workspace/QueryInput';
import InsightBubble from '@/components/workspace/InsightBubble';
import ErrorCard from '../../../components/layout/ErrorCard';
import { Skeleton } from '../../../components/layout/Skeleton';
import type { Dataset } from '../../../types/dataset';
import type { ChartConfig, ChartData, ChartType } from '../../../types/chart';
import { Loader2, ArrowLeft, Download, Database } from 'lucide-react';
import Link from 'next/link';

function QueryResultsTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <p className="text-xs text-slate-400 italic">No rows returned by query.</p>;
  }

  const columns = Object.keys(data[0]);
  const displayData = data.slice(0, 20);
  const hasMore = data.length > 20;

  return (
    <div className="w-full overflow-x-auto border border-slate-200 mt-2">
      <table className="min-w-full divide-y divide-slate-150 text-left text-xs">
        <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 border-b border-slate-200">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-150 bg-white text-slate-600">
          {displayData.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
              {columns.map((col) => {
                const val = row[col];
                return (
                  <td key={col} className="px-4 py-2.5 whitespace-nowrap truncate max-w-[200px]">
                    {val === null || val === undefined ? (
                      <span className="text-slate-300 italic">null</span>
                    ) : typeof val === 'object' ? (
                      JSON.stringify(val)
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
      {hasMore && (
        <p className="text-[10px] text-slate-400 italic p-2.5 border-t border-slate-150 bg-slate-50/50 text-center font-medium">
          Showing first 20 of {data.length} rows.
        </p>
      )}
    </div>
  );
}


export default function WorkspacePage() {
  const [id, setId] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Dataset State
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoadingDataset, setIsLoadingDataset] = useState(true);
  const [datasetError, setDatasetError] = useState<string | null>(null);

  // Current query text being processed
  const [currentQuery, setCurrentQuery] = useState<string>('');

  // Column Selection States for manual visualize
  const [selectedX, setSelectedX] = useState<string | null>(null);
  const [selectedY, setSelectedY] = useState<string | null>(null);

  // Query/Insight Loading States
  const [isQuerying, setIsQuerying] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  // History State (The feed of generated visualisations)
  const [queryHistory, setQueryHistory] = useState<ChartData[]>([]);
  
  // Selected Chart Index for type changes and downloads
  const [selectedChartIndex, setSelectedChartIndex] = useState<number | null>(null);

  // Restore State Indicator
  const [isRestored, setIsRestored] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Retrieve dataset ID from localStorage on mount
  useEffect(() => {
    const storedId = localStorage.getItem('activeWorkspaceId');
    if (storedId) {
      setId(storedId);
    } else {
      setIsLoadingDataset(false);
      router.push('/workspaces');
    }
  }, [router]);

  // Save states to database when they change (only after initial load/restore from DB is complete)
  useEffect(() => {
    if (!id || !isRestored || isLoadingDataset) return;

    const saveHistoryToDb = async () => {
      try {
        await fetch(`/api/dataset/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ queryHistory }),
        });
      } catch (err) {
        console.error('Failed to save workspace history to database:', err);
      }
    };
    saveHistoryToDb();
  }, [queryHistory, id, isRestored, isLoadingDataset]);

  // Fetch Dataset on load
  const fetchDataset = async () => {
    if (!id) return;
    setIsLoadingDataset(true);
    setDatasetError(null);
    try {
      const res = await fetch(`/api/dataset/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Dataset not found. It may have been deleted.');
        }
        throw new Error('Failed to retrieve dataset.');
      }
      const data = await res.json();

      const parsedDataset: Dataset = {
        id: data.id || data._id,
        name: data.name,
        fileName: data.fileName,
        columns: data.columns || [],
        rows: data.rows || [],
        rowCount: data.rowCount || 0,
        uploadedAt: data.uploadedAt,
        userId: data.userId,
        isIndexed: data.isIndexed || false,
        isDbConnection: data.isDbConnection || false,
        dbType: data.dbType,
        dbTableOrCollection: data.dbTableOrCollection,
      };

      setDataset(parsedDataset);

      // Store in Redux for layout headers
      dispatch(
        setActiveDataset({
          id: parsedDataset.id,
          name: parsedDataset.name,
          fileName: parsedDataset.fileName,
          rowCount: parsedDataset.rowCount,
          columns: parsedDataset.columns,
          uploadedAt: parsedDataset.uploadedAt,
          isIndexed: parsedDataset.isIndexed,
          isDbConnection: parsedDataset.isDbConnection,
          dbType: parsedDataset.dbType,
          dbTableOrCollection: parsedDataset.dbTableOrCollection,
        })
      );

      // Restore history from DB if available
      if (data.queryHistory && Array.isArray(data.queryHistory) && data.queryHistory.length > 0) {
        setQueryHistory(data.queryHistory);
      } else {
        setQueryHistory([]);
      }
      setIsRestored(true);
    } catch (err: any) {
      setDatasetError(err?.message || 'Failed to load dataset.');
    } finally {
      setIsLoadingDataset(false);
    }
  };

  useEffect(() => {
    if (id) {
      setIsRestored(false);
      fetchDataset();
    }
    return () => {
      dispatch(clearWorkspace());
    };
  }, [id, dispatch]);

  // Fetch AI Insight for a given chart configuration
  const fetchInsight = async (queryText: string, config: ChartConfig, dataRows: any[]) => {
    setIsGeneratingInsight(true);
    try {
      const isDb = dataset?.isDbConnection || false;
      const transformed = isDb ? dataRows : transformDataForChart(dataRows, config);
      const res = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          chartConfig: config,
          data: transformed,
          isDbConnection: isDb,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate insights.');
      }

      const { insight } = await res.json();

      // Add to Query History (Appended to the end of history list so new charts appear under previous charts)
      const newHistoryItem: ChartData = {
        config,
        data: dataRows,
        insight,
        query: queryText,
        generatedAt: new Date(),
      };

      setQueryHistory((prev) => {
        const updated = [...prev, newHistoryItem];
        setSelectedChartIndex(updated.length - 1); // Auto-select newly generated chart
        return updated;
      });
    } catch (err) {
      console.error('Insight error:', err);
      // Still add to history, just without insight
      const newHistoryItem: ChartData = {
        config,
        data: dataRows,
        query: queryText,
        generatedAt: new Date(),
      };
      setQueryHistory((prev) => {
        const updated = [...prev, newHistoryItem];
        setSelectedChartIndex(updated.length - 1); // Auto-select newly generated chart
        return updated;
      });
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  // Handler for Natural Language Queries
  const handleNaturalLanguageQuery = async (queryText: string) => {
    if (!dataset || isQuerying) return;
    setIsQuerying(true);
    setQueryError(null);
    setCurrentQuery(queryText);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          schema: dataset.columns,
          datasetId: dataset.id,
        }),
      });

      if (!res.ok) {
        throw new Error('Server returned an error while processing query.');
      }

      const result = await res.json();

      if (!result.success || !result.chartConfig) {
        throw new Error(result.error || 'The model was unable to generate a valid chart for this question.');
      }

      // Sync explorer axes inputs if possible
      if (result.chartConfig.xAxis) {
        setSelectedX(result.chartConfig.xAxis);
      }
      if (typeof result.chartConfig.yAxis === 'string') {
        setSelectedY(result.chartConfig.yAxis);
      } else if (Array.isArray(result.chartConfig.yAxis) && result.chartConfig.yAxis.length > 0) {
        setSelectedY(result.chartConfig.yAxis[0]);
      }

      // Chain AI Insight generation
      await fetchInsight(queryText, result.chartConfig, result.rows || dataset.rows);
    } catch (err: any) {
      setQueryError(err?.message || 'An error occurred while answering your question.');
    } finally {
      setIsQuerying(false);
    }
  };

  // Handler for Manual Plots (via column explorer selections)
  const handleManualVisualize = async (xAxis: string, yAxis: string) => {
    if (!dataset || isQuerying) return;
    setIsQuerying(true);
    setQueryError(null);

    const queryText = `Visualize ${yAxis} by ${xAxis}`;
    setCurrentQuery(queryText);

    try {
      const yColType = dataset.columns.find((c) => c.name === yAxis)?.type;
      const isNumeric = yColType === 'number';
      const aggregation = isNumeric ? 'sum' : 'count';

      const config: ChartConfig = {
        id: `manual_${Math.random().toString(36).substring(2, 11)}`,
        chartType: 'bar',
        title: `${yAxis} by ${xAxis}`,
        xAxis,
        yAxis,
        aggregation,
      };

      // Chain AI Insight generation
      await fetchInsight(queryText, config, dataset.rows);
    } catch (err: any) {
      setQueryError(err?.message || 'An error occurred while plotting visual.');
    } finally {
      setIsQuerying(false);
    }
  };

  // Switch Chart Type for a specific history item
  const handleChartTypeChange = (newType: ChartType) => {
    if (selectedChartIndex === null) return;
    setQueryHistory((prev) => {
      const copy = [...prev];
      if (copy[selectedChartIndex]) {
        copy[selectedChartIndex] = {
          ...copy[selectedChartIndex],
          config: {
            ...copy[selectedChartIndex].config,
            chartType: newType,
          },
        };
      }
      return copy;
    });
  };

  const handleClearHistory = () => {
    setQueryHistory([]);
    setSelectedChartIndex(null);
  };

  const handleDownloadReportPdf = async () => {
    if (queryHistory.length === 0) return;
    setIsDownloadingPdf(true);
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const pdfWidth = pageWidth - (margin * 2);

      for (let i = 0; i < queryHistory.length; i++) {
        const cardElement = document.getElementById(`report-card-${i}`);
        if (!cardElement) continue;

        const canvas = await html2canvas(cardElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

        if (i > 0) {
          pdf.addPage();
        }

        const yPos = pdfHeight < pageHeight ? (pageHeight - pdfHeight) / 2 : margin;
        pdf.addImage(imgData, 'PNG', margin, yPos, pdfWidth, Math.min(pdfHeight, pageHeight - (margin * 2)));
      }

      const reportName = `${dataset?.name || 'workspace'}_analysis_report.pdf`;
      pdf.save(reportName);
    } catch (err) {
      console.error('Failed to generate report PDF:', err);
      alert('An error occurred while compiling the PDF report. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Loading Screen
  if (isLoadingDataset) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center p-8 text-center space-y-4">
        <Loader2 className="h-8 w-8 text-slate-800 animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Loading dataset workspace...</p>
        <div className="w-full max-w-lg space-y-3 pt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  // Error Screen
  if (datasetError || !dataset) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center p-8">
        <ErrorCard
          title="Failed to Load Workspace"
          message={datasetError || 'No dataset information is available.'}
          onRetry={fetchDataset}
        />
        <Link
          href="/upload"
          className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to upload page
        </Link>
      </div>
    );
  }

  const currentActiveType = selectedChartIndex !== null && queryHistory[selectedChartIndex]
    ? queryHistory[selectedChartIndex].config.chartType
    : 'bar';

  return (
    <div 
      className="-m-6 h-[calc(100vh-64px)] flex overflow-hidden bg-slate-50"
      onClick={() => setSelectedChartIndex(null)}
    >
      {/* Center Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Sticky Actions Card (Positioned directly under TopBar navbar with zero space, permanent top menu when graphs exist) */}
        {queryHistory.length > 0 && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-b border-slate-200 p-3 shadow-sm flex shrink-0 z-10"
          >
            <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between">
              <button
                onClick={handleDownloadReportPdf}
                disabled={queryHistory.length === 0 || isDownloadingPdf}
                className="inline-flex items-center justify-center bg-[#86BC25] hover:bg-slate-900 text-slate-950 hover:text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-100 font-bold text-xs py-2 px-4 transition-all duration-300 select-none cursor-pointer border border-[#86BC25] hover:border-slate-900 shadow-xs gap-1.5 disabled:cursor-not-allowed"
                title="Download Complete Report as PDF"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Report'}</span>
              </button>
              {!dataset?.isDbConnection && (
                <div className="flex items-center gap-3">
                  {selectedChartIndex === null ? (
                    <span className="text-[11px] font-medium text-slate-400 italic">
                      Click on any chart below to select and change its type
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-700">
                      Editing Visual #{selectedChartIndex + 1}
                    </span>
                  )}
                  <ChartTypeSelector
                    currentType={currentActiveType}
                    onChange={handleChartTypeChange}
                    disabled={selectedChartIndex === null || isQuerying}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Center Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Feed of charts */}
          {queryHistory.map((item, index) => (
            <div
              key={item.config.id || index}
              id={`report-card-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedChartIndex(index);
              }}
              className={`max-w-[1440px] mx-auto w-full space-y-4 bg-white border p-5 transition-all cursor-pointer ${
                selectedChartIndex === index
                  ? 'border-slate-950 ring-1 ring-slate-950'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              {/* Card Selection Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-700">
                  {dataset?.isDbConnection ? 'Analysis' : 'Visual'} #{index + 1}: {item.config.title}
                </span>
              </div>

              {/* Data Table instead of Chart */}
              {dataset?.isDbConnection ? (
                <QueryResultsTable data={item.data} />
              ) : (
                <ChartCanvas
                  config={item.config}
                  data={item.data}
                  containerId={`chart-container-${item.config.id || index}`}
                />
              )}

              {/* AI Insight Bubble */}
              <InsightBubble
                insight={item.insight || null}
                query={item.query}
                isLoading={false}
              />
            </div>
          ))}

          {/* Empty state when no history and not querying */}
          {queryHistory.length === 0 && !isQuerying && (
            dataset?.isDbConnection ? (
              <div className="max-w-[1440px] mx-auto w-full bg-white border border-slate-200 p-8 text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-[#86BC25]/10 text-[#86BC25] flex items-center justify-center mx-auto">
                  <Database className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">Ready to Analyze</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Ask a question in natural language below. DataTalk will execute the query live on your database table/collection and return the summary.
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-[1440px] mx-auto w-full">
                <ChartCanvas
                  isLoading={false}
                  config={null}
                  data={null}
                />
              </div>
            )
          )}

          {/* Query Error Message */}
          {queryError && (
            <div className={`max-w-[1440px] mx-auto w-full p-4 border rounded-2xl flex items-start gap-3 transition-all duration-300 ${queryError === 'this data is not there in dataset'
              ? 'bg-amber-50 border-amber-100 text-amber-700'
              : 'bg-red-50 border-red-100 text-red-600'
              }`}>
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-xs font-semibold">
                  {queryError === 'this data is not there in dataset'
                    ? 'Data Not Found'
                    : 'Visualization Generation Failed'}
                </p>
                <p className={`text-[11px] mt-0.5 ${queryError === 'this data is not there in dataset'
                  ? 'text-amber-600'
                  : 'text-red-500'
                  }`}>{queryError}</p>
              </div>
            </div>
          )}

          {/* Loading placeholder at the bottom when querying */}
          {isQuerying && (
            <div className="max-w-[1440px] mx-auto w-full space-y-4 animate-pulse">
              <div className="flex items-center justify-between bg-slate-100 border border-slate-200 p-3 shadow-sm h-12">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse" />
              </div>
              {dataset?.isDbConnection ? (
                <div className="bg-white border border-slate-200 p-8 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-6 w-6 text-slate-800 animate-spin" />
                  <p className="text-xs text-slate-600 font-semibold animate-pulse">Running live database query...</p>
                </div>
              ) : (
                <ChartCanvas
                  isLoading={true}
                  config={null}
                  data={null}
                />
              )}
              <InsightBubble
                insight={null}
                query={currentQuery}
                isLoading={true}
              />
            </div>
          )}
        </div>

        {/* Bottom Query Input */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="p-6 border-t border-slate-600 bg-slate-800"
        >
          <QueryInput
            onSendQuery={handleNaturalLanguageQuery}
            isQuerying={isQuerying}
            columns={dataset.columns}
          />
        </div>
      </div>
    </div>
  );
}
