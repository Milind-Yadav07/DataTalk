import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-100 rounded ${className || ''}`}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm flex flex-col gap-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2 mt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between border-b border-slate-100 pb-3">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-5 w-1/6" />
        <Skeleton className="h-5 w-1/6" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex justify-between py-2 border-b border-slate-55 last:border-0">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}
