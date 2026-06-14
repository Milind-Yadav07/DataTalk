'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { Database, ChevronRight, Menu, MessageSquare, Loader2 } from 'lucide-react';
import { toggleSidebar } from '../../store/slices/uiSlice';

export default function TopBar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const activeDataset = useAppSelector((state) => state.workspace.activeDataset);

  const [collections, setCollections] = useState<string[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (!activeDataset || !activeDataset.isDbConnection) {
      setCollections([]);
      return;
    }

    const fetchCollections = async () => {
      setIsLoadingCollections(true);
      try {
        const res = await fetch(`/api/dataset/${activeDataset.id}/collections`);
        const data = await res.json();
        if (res.ok && data.success) {
          setCollections(data.collections || []);
        } else {
          console.error('Failed to load collections:', data.error);
        }
      } catch (err) {
        console.error('Error fetching collections:', err);
      } finally {
        setIsLoadingCollections(false);
      }
    };

    fetchCollections();
  }, [activeDataset?.id, activeDataset?.isDbConnection]);

  const handleSwitchCollection = async (newCollection: string) => {
    if (!activeDataset || isSwitching) return;
    if (newCollection === activeDataset.dbTableOrCollection) return;

    setIsSwitching(true);
    try {
      const res = await fetch(`/api/dataset/${activeDataset.id}/switch-collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: newCollection }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to switch database collection.');
      }

      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Error occurred while switching collection.');
      setIsSwitching(false);
    }
  };

  let pageTitle = 'DataTalk';
  let showBreadcrumb = false;

  if (pathname === '/') {
    pageTitle = 'Home';
  } else if (pathname === '/workspaces') {
    pageTitle = 'Recent Workspaces';
  } else if (pathname === '/upload') {
    pageTitle = 'Upload Dataset';
  } else if (pathname === '/database-connection') {
    pageTitle = 'Database Connection';
  } else if (pathname.startsWith('/workspace')) {
    pageTitle = 'Workspace';
    showBreadcrumb = true;
  }

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500 pl-[0.5in]">
        <Link href="/" className="flex items-center gap-1.5 group select-none">
          <span className="font-black text-2xl text-slate-950 tracking-tight">
            Data<span className="text-[#86BC25]">Talk</span>
          </span>
          <span className="h-2 w-2 rounded-full bg-[#86BC25] mt-1.5"></span>
        </Link>
      </div>

      {/* Right side container: Page Title & Hamburger Toggle */}
      <div className="flex items-center gap-9">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <span className={`text-slate-800 font-semibold ${showBreadcrumb && activeDataset ? 'text-slate-500 font-medium' : ''}`}>
            {pageTitle}
          </span>
          {showBreadcrumb && activeDataset && (
            <>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <div className="flex items-center gap-1.5 rounded-none bg-[#86BC25]/10 px-2.5 py-1 text-xs font-bold text-slate-900 border border-[#86BC25]/30">
                {isSwitching || isLoadingCollections ? (
                  <Loader2 className="h-3.5 w-3.5 text-[#86BC25] animate-spin" />
                ) : (
                  <Database className="h-3.5 w-3.5 text-[#86BC25]" />
                )}
                {activeDataset.isDbConnection ? (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">
                      {activeDataset.dbType === 'mongodb' ? 'Mongo' : 'Postgres'}:
                    </span>
                    <select
                      value={activeDataset.dbTableOrCollection || ''}
                      onChange={(e) => handleSwitchCollection(e.target.value)}
                      disabled={isSwitching || isLoadingCollections}
                      className="bg-transparent border-none text-xs font-extrabold text-slate-900 focus:outline-none cursor-pointer pr-1 py-0.5"
                    >
                      {collections.length > 0 ? (
                        collections.map((col) => (
                          <option key={col} value={col} className="bg-white text-slate-900">
                            {col}
                          </option>
                        ))
                      ) : (
                        <option value={activeDataset.dbTableOrCollection || ''}>
                          {activeDataset.dbTableOrCollection || 'Loading...'}
                        </option>
                      )}
                    </select>
                  </div>
                ) : (
                  <span>{activeDataset.name}</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="h-6 w-[1px] bg-slate-200" />

        <button
          onClick={() => dispatch(toggleSidebar())}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-xs transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer active:scale-95"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
