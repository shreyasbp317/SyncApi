import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { MethodBadge } from '../ui/MethodBadge';
import { StatusBadge, StatusCodeBadge } from '../ui/StatusBadge';
import { cn } from '../../utils/cn';
import {
  Activity,
  Play,
  Square,
  RefreshCw,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  Bell,
  BellOff,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { SavedEndpoint, HealthCheck, CheckStatus } from '../../types';

const CRON_PRESETS = [
  { label: 'Every 1 min', value: '*/1 * * * *' },
  { label: 'Every 5 mins', value: '*/5 * * * *' },
  { label: 'Every 15 mins', value: '*/15 * * * *' },
  { label: 'Every 30 mins', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
];

export const MonitorView: React.FC = () => {
  const {
    endpoints,
    healthChecks,
    updateEndpoint,
    startMonitoring,
    stopMonitoring,
    runHealthCheck,
    isMonitorRunning,
  } = useStore();

  const monitorableEndpoints = endpoints;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [runningCheck, setRunningCheck] = useState<string | null>(null);

  const getEndpointChecks = (endpointId: string): HealthCheck[] =>
    healthChecks
      .filter(c => c.endpointId === endpointId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

  const getEndpointStats = (endpointId: string) => {
    const checks = healthChecks.filter(c => c.endpointId === endpointId);
    if (checks.length === 0) return null;

    const successful = checks.filter(c => c.status === 'up').length;
    const avgTime = Math.round(checks.filter(c => c.duration > 0).reduce((a, c) => a + c.duration, 0) / (checks.filter(c => c.duration > 0).length || 1));
    const lastCheck = checks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return {
      uptime: Math.round((successful / checks.length) * 100 * 10) / 10,
      avgTime,
      total: checks.length,
      lastCheck,
      currentStatus: lastCheck.status,
    };
  };

  const handleRunCheck = async (endpointId: string) => {
    setRunningCheck(endpointId);
    await runHealthCheck(endpointId);
    setRunningCheck(null);
  };

  const toggleMonitor = (endpoint: SavedEndpoint) => {
    if (isMonitorRunning(endpoint.id)) {
      stopMonitoring(endpoint.id);
      updateEndpoint(endpoint.id, { monitoringEnabled: false });
    } else {
      updateEndpoint(endpoint.id, { monitoringEnabled: true });
      startMonitoring(endpoint.id);
    }
  };

  const activeMonitors = endpoints.filter(e => isMonitorRunning(e.id)).length;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity size={16} className="text-indigo-400" />
              Health Monitors
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeMonitors} active · {endpoints.length} total endpoints
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">{activeMonitors} Running</span>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint Monitor Cards */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
        {monitorableEndpoints.map(endpoint => {
          const stats = getEndpointStats(endpoint.id);
          const checks = getEndpointChecks(endpoint.id);
          const isExpanded = expandedId === endpoint.id;
          const isRunning = isMonitorRunning(endpoint.id);
          const isCheckRunning = runningCheck === endpoint.id;
          const currentStatus: CheckStatus = stats?.currentStatus || 'unknown';

          return (
            <div key={endpoint.id} className="bg-slate-900 hover:bg-slate-900/80 transition-colors">
              {/* Main Row */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 mt-0.5">
                    <MethodBadge method={endpoint.method} size="xs" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{endpoint.name}</span>
                      <StatusBadge status={currentStatus} />
                      {isRunning && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Monitoring
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-1 truncate">{endpoint.url}</div>

                    {/* Quick Stats */}
                    {stats && (
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            'text-xs font-bold',
                            stats.uptime >= 99 ? 'text-emerald-400' : stats.uptime >= 95 ? 'text-amber-400' : 'text-red-400'
                          )}>
                            {stats.uptime}%
                          </div>
                          <div className="text-[10px] text-slate-600">uptime</div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Zap size={10} className="text-amber-400" />
                          <span className="font-medium text-slate-400">{stats.avgTime}ms</span> avg
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock size={10} />
                          {stats.lastCheck ? formatDistanceToNow(new Date(stats.lastCheck.timestamp), { addSuffix: true }) : 'Never'}
                        </div>
                        <div className="text-[10px] text-slate-600">{stats.total} checks</div>
                      </div>
                    )}

                    {/* Mini uptime bar */}
                    {checks.length > 0 && (
                      <div className="flex gap-0.5 mt-2">
                        {checks.slice(0, 30).reverse().map((check, i) => (
                          <div
                            key={i}
                            className={cn(
                              'h-5 flex-1 rounded-sm',
                              check.status === 'up' ? 'bg-emerald-500' :
                              check.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                            )}
                            title={`${format(new Date(check.timestamp), 'MMM d HH:mm')} — ${check.status} (${check.statusCode}) ${check.duration}ms`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRunCheck(endpoint.id)}
                      disabled={isCheckRunning}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
                      title="Run check now"
                    >
                      <RefreshCw size={13} className={isCheckRunning ? 'animate-spin text-indigo-400' : ''} />
                    </button>

                    <button
                      onClick={() => toggleMonitor(endpoint)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                        isRunning
                          ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'
                          : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20'
                      )}
                    >
                      {isRunning ? <Square size={11} /> : <Play size={11} />}
                      {isRunning ? 'Stop' : 'Start'}
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : endpoint.id)}
                      className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Settings & History */}
              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/40 p-4 space-y-4">
                  {/* Cron Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                        <Settings size={11} /> Schedule (Cron)
                      </label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {CRON_PRESETS.map(p => (
                          <button
                            key={p.value}
                            onClick={() => updateEndpoint(endpoint.id, { cronExpression: p.value })}
                            className={cn(
                              'px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all',
                              endpoint.cronExpression === p.value
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={endpoint.cronExpression}
                        onChange={e => updateEndpoint(endpoint.id, { cronExpression: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        placeholder="*/5 * * * *"
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 size={11} /> Expected Status Code
                        </label>
                        <input
                          type="number"
                          value={endpoint.expectedStatusCode}
                          onChange={e => updateEndpoint(endpoint.id, { expectedStatusCode: parseInt(e.target.value) || 200 })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <Bell size={11} /> Alert Email
                        </label>
                        <input
                          type="email"
                          value={endpoint.alertEmail || ''}
                          onChange={e => updateEndpoint(endpoint.id, { alertEmail: e.target.value })}
                          placeholder="alerts@example.com"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Check History */}
                  <div>
                    <h4 className="text-xs font-medium text-slate-400 mb-2">Recent Check History</h4>
                    {checks.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-600">
                        No health checks yet. Start monitoring or run a check.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {checks.slice(0, 8).map(check => (
                          <div
                            key={check.id}
                            className="flex items-center gap-3 py-1.5 px-3 bg-slate-900 rounded-lg"
                          >
                            {check.status === 'up' ? (
                              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                            ) : check.status === 'degraded' ? (
                              <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                            ) : (
                              <XCircle size={13} className="text-red-400 shrink-0" />
                            )}
                            <StatusCodeBadge code={check.statusCode} />
                            <span className="text-[10px] text-slate-400 font-mono">
                              {format(new Date(check.timestamp), 'MMM d HH:mm:ss')}
                            </span>
                            {check.duration > 0 && (
                              <span className="text-[10px] text-slate-500 ml-auto">
                                {check.duration}ms
                              </span>
                            )}
                            {check.error && (
                              <span className="text-[10px] text-red-400 truncate max-w-[200px]">{check.error}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
