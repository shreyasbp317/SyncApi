import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        variant === 'default' && 'bg-slate-700 text-slate-300',
        variant === 'success' && 'bg-emerald-500/20 text-emerald-400',
        variant === 'error' && 'bg-red-500/20 text-red-400',
        variant === 'warning' && 'bg-amber-500/20 text-amber-400',
        variant === 'info' && 'bg-cyan-500/20 text-cyan-400',
        variant === 'purple' && 'bg-violet-500/20 text-violet-400',
        className
      )}
    >
      {children}
    </span>
  );
};
