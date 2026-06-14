'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, FileSpreadsheet, Eye, Trash2, Loader2, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import type { Dataset } from '@/types/dataset';
import Link from 'next/link';

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Dataset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dataset');
      if (!res.ok) {
        throw new Error('Failed to retrieve workspaces.');
      }
      const data = await res.json();
      setWorkspaces(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load workspaces.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace and all associated vector indexes? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/dataset/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete workspace.');
      }

      // Clear active workspace from localStorage if the deleted workspace was active
      const activeId = localStorage.getItem('activeWorkspaceId');
      if (activeId === id) {
        localStorage.removeItem('activeWorkspaceId');
      }

      setWorkspaces((prev) => prev.filter((w) => {
        const itemId = w.id || (w as any)._id;
        return itemId !== id;
      }));
    } catch (err: any) {
      alert(err?.message || 'Error occurred while deleting workspace.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center p-8 text-center space-y-4">
        <Loader2 className="h-8 w-8 text-slate-800 animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Loading workspaces...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Recent <span className="underline decoration-[#86BC25] decoration-3 underline-offset-6">Workspaces</span>
            </h1>
            <p className="text-slate-500 mt-3 text-sm">
              Manage your uploaded datasets, view indexing status, and jump back into conversation.
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center justify-center bg-[#86BC25] hover:bg-slate-900 text-slate-950 hover:text-white font-bold text-sm py-2.5 px-5 transition-all duration-300 select-none cursor-pointer shrink-0 shadow-sm border border-[#86BC25] hover:border-slate-900"
          >
            Add Workspace
          </Link>
        </div>

        <div className="max-w-md mx-auto mt-16 bg-white border border-red-200 p-8 text-center space-y-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center bg-red-50 text-red-500 border border-red-100 mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Failed to load workspaces</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{error}</p>
          </div>
          <div>
            <button
              onClick={fetchWorkspaces}
              className="inline-flex items-center justify-center bg-slate-900 hover:bg-[#86BC25] text-white hover:text-slate-950 font-bold text-sm py-2.5 px-6 transition-all duration-300 select-none cursor-pointer border border-slate-900 hover:border-[#86BC25] shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Recent <span className="underline decoration-[#86BC25] decoration-3 underline-offset-6">Workspaces</span>
          </h1>
          <p className="text-slate-500 mt-3 text-sm">
            Manage your uploaded datasets, view indexing status, and jump back into conversation.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center justify-center bg-[#86BC25] hover:bg-slate-900 text-slate-950 hover:text-white font-bold text-sm py-2.5 px-5 transition-all duration-300 select-none cursor-pointer shrink-0 shadow-sm border border-[#86BC25] hover:border-slate-900"
        >
          Add Workspace
        </Link>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[35vh] border border-dashed border-slate-300 rounded-2xl bg-white p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4 border border-slate-100">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No workspaces found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto mb-6">
            Import a CSV file or Excel spreadsheet to create your first queryable AI workspace.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center justify-center bg-[#86BC25] hover:bg-slate-900 text-slate-950 hover:text-white font-bold text-sm py-2.5 px-6 transition-all duration-300 select-none cursor-pointer shadow-sm border border-[#86BC25] hover:border-slate-900"
          >
            Import a Dataset
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((w) => {
            const id = w.id || (w as any)._id;
            const uploadDate = w.uploadedAt ? new Date(w.uploadedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }) : 'Unknown date';

            return (
              <div
                key={id}
                className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-slate-400 p-6 space-y-5"
              >
                {/* Top: Icon and Dataset Name */}
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 flex items-center justify-center bg-slate-50 border border-slate-100 shrink-0">
                    {w.isDbConnection ? (
                      <Database className="h-6 w-6 text-[#86BC25]" />
                    ) : (
                      <FileSpreadsheet className="h-6 w-6 text-[#86BC25]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-slate-900 text-base tracking-tight line-clamp-2 leading-tight" title={w.name}>
                      {w.name}
                    </h4>
                    <p className="text-slate-400 text-xs mt-1 truncate" title={w.fileName}>
                      {w.fileName}
                    </p>
                  </div>
                </div>

                {/* Middle: Date and Delete Icon */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    {uploadDate}
                  </span>
                  <button
                    onClick={() => handleDelete(id)}
                    className="flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                    title="Delete Workspace"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Bottom: Open Workspace Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      localStorage.setItem('activeWorkspaceId', id);
                      router.push('/workspace');
                    }}
                    className="w-full inline-flex items-center justify-center bg-slate-900 hover:bg-[#86BC25] text-white hover:text-slate-950 font-bold text-sm py-2.5 transition-all duration-300 select-none cursor-pointer border border-slate-900 hover:border-[#86BC25] shadow-xs"
                  >
                    Open Workspace
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
