'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Home, Upload, Database, LogOut, X, Link2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setSidebarOpen } from '../../store/slices/uiSlice';

export default function AppSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const { data: session } = useSession();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'Recent Workspaces', href: '/workspaces', icon: Database },
    { name: 'Database Connection', href: '/database-connection', icon: Link2 },
  ];

  return (
    <>
      {/* Click-to-close Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 right-0 z-40 flex w-64 flex-col border-l border-slate-200 bg-white text-slate-900 shadow-2xl transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header with Close Button */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
          <span className="font-extrabold text-[10px] text-slate-900 uppercase tracking-widest">Navigation</span>
          <button
            onClick={() => dispatch(setSidebarOpen(false))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href.split('?')[0]);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => dispatch(setSidebarOpen(false))}
                className={`flex items-center gap-3 py-3 text-sm font-medium transition-all group border-l-4 ${
                  isActive
                    ? 'bg-slate-50 text-slate-950 font-bold border-[#86BC25] pl-4'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50/50 border-l-transparent hover:border-slate-200 pl-4'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-[#86BC25]' : 'text-slate-400 group-hover:text-slate-700'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout Footer */}
        <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/60">
          {session?.user && (
            <div className="flex items-center gap-3 bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs hover:border-[#86BC25]/30 transition-all">
              <div className="relative shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white font-bold text-sm shadow-sm select-none">
                  {session.user.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#86BC25] border-2 border-white"></span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-slate-900 truncate">{session.user.name || 'User'}</span>
                <span className="text-[10px] font-medium text-slate-500 truncate">{session.user.email}</span>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              dispatch(setSidebarOpen(false));
              signOut({ callbackUrl: '/login' });
            }}
            className="flex w-full items-center justify-center gap-2 border border-slate-200/80 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
