import React from 'react';
import { cn } from '../../utils/cn';
import { HttpMethod } from '../../types';

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  PUT: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  PATCH: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border border-red-500/30',
  HEAD: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  OPTIONS: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

interface MethodBadgeProps {
  method: HttpMethod;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method, size = 'sm', className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-bold rounded tracking-wide',
        size === 'xs' && 'px-1.5 py-0.5 text-[9px] min-w-[38px]',
        size === 'sm' && 'px-2 py-0.5 text-[10px] min-w-[44px]',
        size === 'md' && 'px-2.5 py-1 text-xs min-w-[52px]',
        METHOD_COLORS[method],
        className
      )}
    >
      {method}
    </span>
  );
};
