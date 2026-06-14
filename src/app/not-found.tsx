'use client';

import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden font-sans select-none">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      
      {/* Content card */}
      <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl text-center">
        <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/25 rounded-2xl flex items-center justify-center mb-6 mx-auto text-indigo-400">
          <FileQuestion className="w-8 h-8 animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
        
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-200 mb-3">Page Not Found</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          The page you are looking for doesn't exist, or you don't have authorization to view it.
        </p>

        <Link
          href="/"
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium py-3 rounded-lg shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
}
