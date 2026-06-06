import { twMerge } from 'tailwind-merge';

export function PageHeader({ title, subtitle, actions, breadcrumb, className }) {
  return (
    <div className={twMerge('mb-6', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-2 flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              {crumb.href
                ? <a href={crumb.href} className="hover:text-gray-600 dark:hover:text-gray-300">{crumb.label}</a>
                : <span className="text-gray-600 dark:text-gray-300">{crumb.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
