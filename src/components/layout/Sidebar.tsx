import React from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import {
  Zap,
  FolderOpen,
  Activity,
  BarChart3,
  Bell,
  ExternalLink,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'client' as const, label: 'API Client', icon: Zap, shortcut: '1' },
  { id: 'collections' as const, label: 'Collections', icon: FolderOpen, shortcut: '2' },
  { id: 'monitor' as const, label: 'Monitor', icon: Activity, shortcut: '3' },
  { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3, shortcut: '4' },
  { id: 'alerts' as const, label: 'Alerts', icon: Bell, shortcut: '5' },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, alerts, endpoints } = useStore();
  const unreadAlerts = alerts.filter(a => !a.acknowledged).length;
  const monitoredCount = endpoints.filter(e => e.monitoringEnabled).length;

  return (
    <aside className="w-16 lg:w-56 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-3 lg:px-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="hidden lg:block">
            <div className="font-bold text-white text-sm tracking-tight">SyncAPI</div>
            <div className="text-[10px] text-slate-500 font-medium">Testing & Monitoring</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon, shortcut }) => {
          const isActive = activeTab === id;
          const showBadge = id === 'alerts' && unreadAlerts > 0;
          const showMonBadge = id === 'monitor' && monitoredCount > 0;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              <div className="relative shrink-0">
                <Icon className={cn('w-4.5 h-4.5', isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200')} size={18} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
                {showMonBadge && !showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </span>
                )}
              </div>
              <span className="hidden lg:block">{label}</span>
              <span className="hidden lg:block ml-auto text-[10px] text-slate-600 group-hover:text-slate-500 font-mono">
                ⌘{shortcut}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-2 space-y-1">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all text-sm"
        >
          <ExternalLink size={16} className="shrink-0" />
          <span className="hidden lg:block text-xs">View on GitHub</span>
        </a>
        <div className="hidden lg:flex items-center gap-2 px-2 py-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 shrink-0" />
          <div>
            <div className="text-xs text-slate-300 font-medium">Developer</div>
            <div className="text-[10px] text-slate-500">Free Plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
