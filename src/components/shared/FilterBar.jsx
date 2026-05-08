import { twMerge } from 'tailwind-merge';

export function FilterBar({ children, onReset, hasActiveFilters, activeCount, className }) {
  return (
    <div className={twMerge('flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3', className)}>
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {children}
      </div>
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm text-amber-600">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {activeCount ? `${activeCount} filter${activeCount !== 1 ? 's' : ''} active` : 'Filters active'}
          </span>
          {onReset && (
            <button
              onClick={onReset}
              className="text-sm font-medium text-gray-500 underline-offset-2 hover:text-gray-700 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
