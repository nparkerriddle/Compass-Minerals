import { twMerge } from 'tailwind-merge';

const deltaColors = {
  positive: 'text-green-600 dark:text-green-400',
  negative: 'text-red-600 dark:text-red-400',
  neutral: 'text-gray-500 dark:text-gray-400',
};

export function KpiCard({ title, value, delta, deltaType = 'neutral', subtitle, icon, loading, className }) {
  if (loading) {
    return (
      <div className={twMerge('rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm', className)}>
        <div className="h-3.5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-3 h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-2 h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className={twMerge('rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {delta && (
          <span className={twMerge('text-sm font-medium', deltaColors[deltaType])}>
            {delta}
          </span>
        )}
        {subtitle && <span className="text-sm text-gray-400 dark:text-gray-500">{subtitle}</span>}
      </div>
    </div>
  );
}
