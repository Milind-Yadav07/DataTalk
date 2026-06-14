import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorCard({ title = 'An error occurred', message, onRetry }: ErrorCardProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
      <div className="w-full rounded-xl border border-red-200 bg-red-50/50 p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          </div>
        </div>
        {onRetry && (
          <div className="flex justify-end mt-2">
            <button
              onClick={onRetry}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-all cursor-pointer shadow-sm shadow-red-500/10"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
