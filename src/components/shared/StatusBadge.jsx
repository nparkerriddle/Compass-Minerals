import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

const badge = cva('inline-flex items-center gap-1.5 rounded-full font-medium', {
  variants: {
    status: {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-amber-100 text-amber-800',
      danger: 'bg-red-100 text-red-800',
      neutral: 'bg-gray-100 text-gray-700',
      info: 'bg-blue-100 text-blue-800',
    },
    size: {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-xs',
    },
  },
  defaultVariants: { status: 'neutral', size: 'md' },
});

const dotColor = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  neutral: 'bg-gray-400',
  info: 'bg-blue-500',
};

export function StatusBadge({ status = 'neutral', label, dot = true, size = 'md', className }) {
  return (
    <span className={twMerge(badge({ status, size }), className)}>
      {dot && <span className={twMerge('h-1.5 w-1.5 rounded-full', dotColor[status])} />}
      {label}
    </span>
  );
}
