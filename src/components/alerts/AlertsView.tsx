import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { Alert } from '../../types';
import {
  Bell,
  AlertTriangle,
  XCircle,
  Zap,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

type FilterType = 'all' | 'unread' | 'down' | 'slow' | 'error';

const ALERT_ICONS: Record<string, React.ReactNode> = {
  down: <XCircle size={15} className="text-red-400" />,
  slow: <Zap size={15} className="text-amber-400" />,
  error: <AlertTriangle size={15} className="text-orange-400" />,
};

const ALERT_COLORS: Record<string, string> = {
  down: 'border-red-500/30 bg-red-500/5',
  slow: 'border-amber-500/30 bg-amber-500/5',
  error: 'border-orange-500/30 bg-orange-500/5',
};

export const AlertsView: React.FC = () => {
  const { alerts, acknowledgeAlert, clearAlerts, endpoints } = useStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'unread') return !a.acknowledged;
    if (filter === 'all') return true;
    return a.type === filter;
  });

  const unreadCount = alerts.filter(a => !a.acknowledged).length;

  const handleAckAll = () => {
    alerts.filter(a => !a.acknowledged).forEach(a => acknowledgeAlert(a.id));
  };

  const getEndpoint = (endpointId: string) => endpoints.find(e => e.id === endpointId);

  const FILTERS: { id: FilterType; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: alerts.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'down', label: 'Down', count: alerts.filter(a => a.type === 'down').length },
    { id: 'slow', label: 'Slow', count: alerts.filter(a => a.type === 'slow').length },
    { id: 'error', label: 'Error', count: alerts.filter(a => a.type === 'error').length },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Bell size={16} className="text-indigo-400" />
              Alerts & Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleAckAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs rounded-lg transition-all"
              >
                <CheckCheck size={13} />
                Mark All Read
              </button>
            )}
            <button
              onClick={clearAlerts}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 text-slate-400 hover:text-red-400 text-xs rounded-lg transition-all"
            >
              <Trash2 size={13} />
              Clear All
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={12} className="text-slate-500" />
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all',
                filter === f.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              )}
            >
              {f.label}
              {(f.count ?? 0) > 0 && (
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                  filter === f.id ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                )}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Bell className="text-slate-600" size={24} />
            </div>
            <div>
              <p className="text-slate-400 font-medium text-sm">
                {filter === 'unread' ? 'All caught up!' : 'No alerts'}
              </p>
              <p className="text-slate-600 text-xs mt-1">
                {filter === 'unread'
                  ? 'No unread alerts at this time'
                  : 'Alerts will appear here when endpoints fail health checks'}
              </p>
            </div>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              endpoint={getEndpoint(alert.endpointId)}
              isExpanded={expandedId === alert.id}
              onToggle={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
              onAcknowledge={() => acknowledgeAlert(alert.id)}
            />
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="border-t border-slate-800 p-3 bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <XCircle size={11} className="text-red-400" />
            {alerts.filter(a => a.type === 'down').length} down
          </span>
          <span className="flex items-center gap-1.5">
            <Zap size={11} className="text-amber-400" />
            {alerts.filter(a => a.type === 'slow').length} slow
          </span>
          <span className="flex items-center gap-1.5">
            <AlertTriangle size={11} className="text-orange-400" />
            {alerts.filter(a => a.type === 'error').length} error
          </span>
        </div>
        <span className="text-xs text-slate-600">{alerts.length} total alerts</span>
      </div>
    </div>
  );
};

interface AlertItemProps {
  alert: Alert;
  endpoint: { url: string; method: string } | undefined;
  isExpanded: boolean;
  onToggle: () => void;
  onAcknowledge: () => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, endpoint, isExpanded, onToggle, onAcknowledge }) => {
  return (
    <div className={cn(
      'border-l-2 transition-all',
      alert.type === 'down' ? 'border-l-red-500' :
      alert.type === 'slow' ? 'border-l-amber-500' : 'border-l-orange-500',
      !alert.acknowledged ? 'bg-slate-900' : 'bg-slate-950/30'
    )}>
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
          ALERT_COLORS[alert.type]
        )}>
          {ALERT_ICONS[alert.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{alert.endpointName}</span>
            {!alert.acknowledged && (
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            )}
            <span className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide',
              alert.type === 'down' ? 'bg-red-500/20 text-red-400' :
              alert.type === 'slow' ? 'bg-amber-500/20 text-amber-400' : 'bg-orange-500/20 text-orange-400'
            )}>
              {alert.type}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">{alert.message}</p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1 text-[10px] text-slate-600">
              <Clock size={10} />
              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
            </div>
            {endpoint && (
              <div className="text-[10px] text-slate-600 font-mono truncate max-w-[200px]">{endpoint.url}</div>
            )}
          </div>

          {isExpanded && (
            <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Timestamp</span>
                <span className="text-slate-300 font-mono">{format(new Date(alert.timestamp), 'yyyy-MM-dd HH:mm:ss')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Endpoint URL</span>
                <span className="text-slate-300 font-mono text-right break-all max-w-[250px]">{endpoint?.url || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Alert Type</span>
                <span className="text-slate-300 capitalize">{alert.type}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Status</span>
                <span className={alert.acknowledged ? 'text-emerald-400' : 'text-amber-400'}>
                  {alert.acknowledged ? 'Acknowledged' : 'Pending'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggle}
            className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-800"
          >
            <ChevronRight size={14} className={cn('transition-transform', isExpanded && 'rotate-90')} />
          </button>
          {!alert.acknowledged && (
            <button
              onClick={onAcknowledge}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-500/15 border border-slate-700 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 text-[11px] font-medium rounded-lg transition-all"
            >
              <Check size={11} />
              Ack
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
