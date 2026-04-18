import React from 'react';
import { cn } from '../../utils/cn';
import { CheckStatus } from '../../types';

interface StatusBadgeProps {
  status: CheckStatus;
  className?: string;
}

const STATUS_MAP: Record<CheckStatus, { label: string; classes: string; dot: string }> = {
  up: { label: 'UP', classes: 'bg-emerald-500/20 text-emerald-400', dot: 'bg-emerald-400' },
  down: { label: 'DOWN', classes: 'bg-red-500/20 text-red-400', dot: 'bg-red-400' },
  degraded: { label: 'DEGRADED', classes: 'bg-amber-500/20 text-amber-400', dot: 'bg-amber-400' },
  unknown: { label: 'UNKNOWN', classes: 'bg-slate-500/20 text-slate-400', dot: 'bg-slate-400' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = STATUS_MAP[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold rounded-full',
        config.classes,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', config.dot)} />
      {config.label}
    </span>
  );
};

interface StatusCodeBadgeProps {
  code: number;
  className?: string;
}

export const StatusCodeBadge: React.FC<StatusCodeBadgeProps> = ({ code, className }) => {
  const isSuccess = code >= 200 && code < 300;
  const isRedirect = code >= 300 && code < 400;
  const isClientError = code >= 400 && code < 500;
  const isServerError = code >= 500;
  const isNetworkError = code === 0;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-bold rounded',
        isSuccess && 'bg-emerald-500/20 text-emerald-400',
        isRedirect && 'bg-blue-500/20 text-blue-400',
        isClientError && 'bg-amber-500/20 text-amber-400',
        isServerError && 'bg-red-500/20 text-red-400',
        isNetworkError && 'bg-slate-500/20 text-slate-400',
        className
      )}
    >
      {code === 0 ? 'ERR' : code}
    </span>
  );
};
