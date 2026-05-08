import { twMerge } from 'tailwind-merge';

export function Skeleton({ className, height, width }) {
  return (
    <div
      className={twMerge('animate-pulse rounded bg-gray-200', className)}
      style={{ height, width }}
    />
  );
}

export function KpiCardSkeleton({ className }) {
  return (
    <div className={twMerge('rounded-lg border border-gray-200 bg-white p-5 shadow-sm', className)}>
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="mt-3 h-8 w-32" />
      <Skeleton className="mt-2 h-3 w-16" />
      <div className="mt-4 h-10" />
    </div>
  );
}

export function ChartSkeleton({ className }) {
  return (
    <div className={twMerge('rounded-lg border border-gray-200 bg-white p-5 shadow-sm', className)}>
      <Skeleton className="mb-4 h-4 w-40" />
      <div className="flex h-48 items-end gap-2">
        {[60, 80, 45, 90, 70, 55, 85, 65, 75, 50, 88, 72].map((h, i) => (
          <div key={i} className="flex-1 animate-pulse rounded-t bg-gray-200" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-2 flex justify-between">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-3 w-8" />)}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, className }) {
  return (
    <div className={twMerge('overflow-hidden rounded-lg border border-gray-200 bg-white', className)}>
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex gap-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-3.5 w-20" />)}
        </div>
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-8 border-b border-gray-100 px-4 py-3 last:border-0">
          {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-3.5 w-24" />)}
        </div>
      ))}
    </div>
  );
}

export function TextSkeleton({ lines = 3, className }) {
  const widths = ['w-full', 'w-4/5', 'w-3/5'];
  return (
    <div className={twMerge('space-y-2', className)}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton key={i} className={twMerge('h-3.5', widths[i % widths.length])} />
      ))}
    </div>
  );
}
