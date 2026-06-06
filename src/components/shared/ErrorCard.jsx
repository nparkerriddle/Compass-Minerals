import { twMerge } from 'tailwind-merge';

export function ErrorCard({ title = 'Failed to load data', message, onRetry, className }) {
  return (
    <div className={twMerge('rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-5', className)}>
      <p className="text-sm font-semibold text-red-800 dark:text-red-300">{title}</p>
      {message && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-red-700 dark:text-red-400 underline-offset-2 hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
