import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Server,
} from 'lucide-react';
import { HealthCheck } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { MethodBadge } from '../ui/MethodBadge';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, color = '#6366f1', trend }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
    <div className="flex items-start justify-between mb-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      {trend && (
        <div className={cn(
          'flex items-center gap-1 text-[10px] font-medium',
          trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
        )}>
          {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : null}
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
    <div className="text-xs text-slate-500">{label}</div>
    {sub && <div className="text-[11px] text-slate-600 mt-1">{sub}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl text-xs">
        <div className="text-slate-400 mb-2 font-medium">{label}</div>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-300">{p.name}:</span>
            <span className="text-white font-semibold">{p.value}{p.name.includes('uptime') ? '%' : p.name.includes('time') ? 'ms' : ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardView: React.FC = () => {
  const { endpoints, healthChecks, alerts } = useStore();

  // Compute global stats
  const globalStats = useMemo(() => {
    const monitoredEndpoints = endpoints.filter(e => healthChecks.some(c => c.endpointId === e.id));
    const totalChecks = healthChecks.length;
    const upChecks = healthChecks.filter(c => c.status === 'up').length;
    const downChecks = healthChecks.filter(c => c.status === 'down').length;
    const avgResponseTime = healthChecks.filter(c => c.duration > 0).length > 0
      ? Math.round(healthChecks.filter(c => c.duration > 0).reduce((a, c) => a + c.duration, 0) / healthChecks.filter(c => c.duration > 0).length)
      : 0;
    const overallUptime = totalChecks > 0 ? Math.round((upChecks / totalChecks) * 100 * 10) / 10 : 0;
    const unackedAlerts = alerts.filter(a => !a.acknowledged).length;

    return { monitoredEndpoints: monitoredEndpoints.length, totalChecks, upChecks, downChecks, avgResponseTime, overallUptime, unackedAlerts };
  }, [endpoints, healthChecks, alerts]);

  // Daily uptime trend (last 7 days)
  const dailyTrend = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    return days.map(day => {
      const dayStart = startOfDay(day).getTime();
      const dayEnd = dayStart + 86400000;
      const dayChecks = healthChecks.filter(c => {
        const t = new Date(c.timestamp).getTime();
        return t >= dayStart && t < dayEnd;
      });
      const upCount = dayChecks.filter(c => c.status === 'up').length;
      const avgTime = dayChecks.filter(c => c.duration > 0).length > 0
        ? Math.round(dayChecks.filter(c => c.duration > 0).reduce((a, c) => a + c.duration, 0) / dayChecks.filter(c => c.duration > 0).length)
        : 0;
      return {
        date: format(day, 'MMM d'),
        uptime: dayChecks.length > 0 ? Math.round((upCount / dayChecks.length) * 100 * 10) / 10 : 100,
        avgResponseTime: avgTime,
        checks: dayChecks.length,
        failures: dayChecks.filter(c => c.status !== 'up').length,
      };
    });
  }, [healthChecks]);

  // Per-endpoint stats
  const endpointStats = useMemo(() => {
    return endpoints
      .map(ep => {
        const checks = healthChecks.filter(c => c.endpointId === ep.id);
        if (checks.length === 0) return null;
        const upCount = checks.filter(c => c.status === 'up').length;
        const avgTime = checks.filter(c => c.duration > 0).length > 0
          ? Math.round(checks.filter(c => c.duration > 0).reduce((a, c) => a + c.duration, 0) / checks.filter(c => c.duration > 0).length)
          : 0;
        const lastCheck = checks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        return {
          ...ep,
          uptime: Math.round((upCount / checks.length) * 100 * 10) / 10,
          avgTime,
          total: checks.length,
          currentStatus: lastCheck.status,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a!.uptime - b!.uptime));
  }, [endpoints, healthChecks]);

  // Method distribution
  const methodDist = useMemo(() => {
    const counts: Record<string, number> = {};
    endpoints.forEach(e => { counts[e.method] = (counts[e.method] || 0) + 1; });
    return Object.entries(counts).map(([method, count]) => ({ method, count }));
  }, [endpoints]);

  // Recent checks for activity feed
  const recentChecks = useMemo(() =>
    [...healthChecks]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10),
    [healthChecks]
  );

  const getEndpointName = (id: string) => endpoints.find(e => e.id === id)?.name || id;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-5 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 size={20} className="text-indigo-400" />
          Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-1">Uptime trends & performance analytics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity size={18} />}
          label="Overall Uptime"
          value={`${globalStats.overallUptime}%`}
          sub={`${globalStats.totalChecks} total checks`}
          color="#10b981"
          trend={globalStats.overallUptime >= 99 ? 'up' : globalStats.overallUptime < 95 ? 'down' : 'neutral'}
        />
        <StatCard
          icon={<Zap size={18} />}
          label="Avg Response Time"
          value={`${globalStats.avgResponseTime}ms`}
          sub="across all endpoints"
          color="#f59e0b"
        />
        <StatCard
          icon={<Server size={18} />}
          label="Monitored Endpoints"
          value={globalStats.monitoredEndpoints}
          sub={`of ${endpoints.length} total`}
          color="#6366f1"
        />
        <StatCard
          icon={<XCircle size={18} />}
          label="Active Alerts"
          value={globalStats.unackedAlerts}
          sub={`${globalStats.downChecks} failures recorded`}
          color={globalStats.unackedAlerts > 0 ? '#ef4444' : '#10b981'}
          trend={globalStats.unackedAlerts > 0 ? 'down' : 'neutral'}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Uptime Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">7-Day Uptime Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dailyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[85, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="uptime" name="uptime" stroke="#10b981" strokeWidth={2} fill="url(#uptimeGrad)" dot={{ fill: '#10b981', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Method Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Endpoint Methods</h3>
          {methodDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={methodDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="count" nameKey="method" paddingAngle={3}>
                  {methodDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-44 text-slate-600 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Response Time Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Avg Response Time (7 days)</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={dailyTrend} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}ms`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgResponseTime" name="avg response time" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Failures Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Daily Check Volume</h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={dailyTrend} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="checks" name="checks" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failures" name="failures" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Endpoint Health Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Endpoint Health Overview</h3>
          <div className="space-y-2">
            {endpointStats.length === 0 ? (
              <div className="text-center py-6 text-slate-600 text-sm">
                No monitoring data yet. Start health checks to see data here.
              </div>
            ) : (
              endpointStats.map(ep => ep && (
                <div key={ep.id} className="flex items-center gap-3 py-2 border-b border-slate-800/50">
                  <MethodBadge method={ep.method} size="xs" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-300 truncate font-medium">{ep.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            ep.uptime >= 99 ? 'bg-emerald-500' : ep.uptime >= 95 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                          style={{ width: `${ep.uptime}%` }}
                        />
                      </div>
                      <span className={cn(
                        'text-[10px] font-bold shrink-0',
                        ep.uptime >= 99 ? 'text-emerald-400' : ep.uptime >= 95 ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {ep.uptime}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={ep.currentStatus} />
                    <div className="text-[10px] text-slate-600 mt-0.5">{ep.avgTime}ms avg</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {recentChecks.length === 0 ? (
              <div className="text-center py-6 text-slate-600 text-sm">No recent activity</div>
            ) : (
              recentChecks.map(check => (
                <div key={check.id} className="flex items-center gap-3 py-1.5">
                  {check.status === 'up' ? (
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-red-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-300 truncate">{getEndpointName(check.endpointId)}</div>
                    <div className="text-[10px] text-slate-600">
                      {format(new Date(check.timestamp), 'MMM d, HH:mm:ss')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn(
                      'text-[10px] font-bold',
                      check.status === 'up' ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {check.statusCode || 'ERR'}
                    </div>
                    {check.duration > 0 && (
                      <div className="text-[10px] text-slate-600">{check.duration}ms</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
