'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Sparkles, CheckCircle2, AlertCircle, Loader2, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';

export default function DatabaseConnectionPage() {
  const router = useRouter();
  const [dbType, setDbType] = useState<'mongodb' | 'postgresql'>('mongodb');
  const [connectionString, setConnectionString] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [showConnectionString, setShowConnectionString] = useState(false);

  // States for Testing Connection
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');

  // States for Saving/Starting
  const [isSaving, setIsSaving] = useState(false);

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionString.trim()) return;

    setIsTesting(true);
    setTestSuccess(false);
    setTestError(null);
    setCollections([]);
    setSelectedTable('');

    try {
      const res = await fetch('/api/database/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbType, connectionString }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to establish connection.');
      }

      setCollections(data.items || []);
      setTestSuccess(true);
      if (data.items && data.items.length > 0) {
        setSelectedTable(data.items[0]);
      }
    } catch (err: any) {
      setTestError(err.message || 'Connection failed. Please check your connection details and network permissions.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedTable) return;

    setIsSaving(true);
    try {
      const finalName = workspaceName.trim() || `${dbType === 'mongodb' ? 'Mongo' : 'Postgres'}: ${selectedTable}`;
      
      const res = await fetch('/api/database/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbType,
          connectionString,
          tableOrCollection: selectedTable,
          workspaceName: finalName
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize database workspace.');
      }

      // Save active workspace ID to localStorage
      localStorage.setItem('activeWorkspaceId', data.datasetId);
      router.push('/workspace');
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving workspace.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          Connect Your <span className="underline decoration-[#86BC25] decoration-3 underline-offset-6">Database</span>
        </h1>
        <p className="text-slate-500 mt-3 text-sm">
          Link a live MongoDB or PostgreSQL database to perform natural language analytics and run instant queries.
        </p>
      </div>

      <div className="h-4" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Connection Form (Left 2 columns) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-none space-y-6">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-3">
              Connection Settings
            </h2>

            {/* Select DB Type */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700">Select Database Engine</label>
              <div className="grid grid-cols-2 gap-4">
                {/* MongoDB Selector */}
                <button
                  type="button"
                  onClick={() => {
                    setDbType('mongodb');
                    setTestSuccess(false);
                    setCollections([]);
                  }}
                  className={`flex items-center justify-center gap-2 p-2.5 border transition-all cursor-pointer ${
                    dbType === 'mongodb'
                      ? 'border-[#86BC25] bg-[#86BC25]/5 text-[#86BC25]'
                      : 'border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Database className="h-4 w-4" />
                  <span className="text-xs font-bold tracking-wider uppercase">MongoDB</span>
                </button>

                {/* PostgreSQL Selector */}
                <button
                  type="button"
                  onClick={() => {
                    setDbType('postgresql');
                    setTestSuccess(false);
                    setCollections([]);
                  }}
                  className={`flex items-center justify-center gap-2 p-2.5 border transition-all cursor-pointer ${
                    dbType === 'postgresql'
                      ? 'border-[#86BC25] bg-[#86BC25]/5 text-[#86BC25]'
                      : 'border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Database className="h-4 w-4" />
                  <span className="text-xs font-bold tracking-wider uppercase">PostgreSQL</span>
                </button>
              </div>
            </div>

            {/* Connection String Input */}
            <form onSubmit={handleTestConnection} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Connection URI</span>
                  <span className="text-slate-400 font-normal italic">Credentials are encrypted</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showConnectionString ? 'text' : 'password'}
                    value={connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    placeholder={
                      dbType === 'mongodb'
                        ? 'mongodb+srv://username:password@cluster.mongodb.net/database'
                        : 'postgresql://username:password@host:5432/database'
                    }
                    required
                    className="w-full border border-slate-200 p-3 pr-10 text-sm focus:border-[#86BC25] focus:outline-none placeholder-slate-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConnectionString(!showConnectionString)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showConnectionString ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isTesting || !connectionString.trim()}
                  className="w-full inline-flex items-center justify-center bg-slate-900 hover:bg-[#86BC25] text-white hover:text-slate-950 font-bold text-sm py-2.5 transition-all duration-300 select-none cursor-pointer border border-slate-900 hover:border-[#86BC25] shadow-xs gap-2 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-100 disabled:cursor-not-allowed"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Testing Connection...</span>
                    </>
                  ) : (
                    <span>Test Connection</span>
                  )}
                </button>
              </div>
            </form>

            {/* Error Message */}
            {testError && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-none flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Connection Failed</h4>
                  <p className="text-[11px] mt-1 text-red-500/90 leading-relaxed font-mono break-all">
                    {testError}
                  </p>
                </div>
              </div>
            )}

            {/* Success Flow & Schema Selector */}
            {testSuccess && (
              <div className="p-5 border border-emerald-100 bg-emerald-50/20 rounded-none space-y-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                      Connected Successfully
                    </h4>
                    <p className="text-[11px] text-emerald-600/90 mt-1">
                      Found {collections.length} {dbType === 'mongodb' ? 'collections' : 'tables'} in the database.
                    </p>
                  </div>
                </div>

                {collections.length === 0 ? (
                  <div className="p-3 border border-amber-200 bg-amber-50 text-amber-700 text-xs rounded-none">
                    ⚠️ The database connects successfully, but no tables or collections were found in the public schema.
                  </div>
                ) : (
                  <div className="space-y-4 pt-2 border-t border-emerald-100">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Your database connection is established. You can view, query, and switch between all collections/tables directly on the workspace page.
                    </p>
                    
                    {/* Start Button */}
                    <button
                      onClick={handleStartAnalysis}
                      disabled={isSaving}
                      className="w-full inline-flex items-center justify-center bg-[#86BC25] hover:bg-slate-900 text-slate-950 hover:text-white font-bold text-sm py-2.5 transition-all duration-300 select-none cursor-pointer border border-[#86BC25] hover:border-slate-900 shadow-xs gap-2 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Mapping Schema...</span>
                        </>
                      ) : (
                        <>
                          <span>Analyze Database</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Security / Sidebar Notice (Right 1 column) */}
        <div className="h-full">
          {/* Security Notice Card */}
          <div className="bg-slate-900 text-white p-6 border border-slate-800 rounded-none shadow-sm h-full flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#86BC25]" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#86BC25]">
                  Strictly Read-Only
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                DataTalk connects to your database in <span className="font-semibold text-white">Read-Only mode</span>. We will never write, update, modify, or delete your tables or collections.
              </p>
            </div>
            <div className="p-4 border border-slate-800 bg-slate-950/40 rounded-none space-y-2">
              <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#86BC25]" />
                AI Guardrails
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All generated SQL queries and MongoDB stages are rigorously scanned on the server. Write-commands are blocked automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
