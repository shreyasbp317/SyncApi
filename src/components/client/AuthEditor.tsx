import React from 'react';
import { Auth, AuthType } from '../../types';
import { cn } from '../../utils/cn';
import { Lock, Key, User } from 'lucide-react';

interface AuthEditorProps {
  auth: Auth;
  onChange: (auth: Auth) => void;
}

const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'No Auth' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'api-key', label: 'API Key' },
];

export const AuthEditor: React.FC<AuthEditorProps> = ({ auth, onChange }) => {
  const update = (updates: Partial<Auth>) => onChange({ ...auth, ...updates });

  return (
    <div className="space-y-4">
      {/* Auth Type Selector */}
      <div>
        <label className="text-xs font-medium text-slate-400 mb-2 block uppercase tracking-wider">Authorization Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {AUTH_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update({ type: value })}
              className={cn(
                'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                auth.type === value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              )}
            >
              {value === 'bearer' && <Lock size={11} />}
              {value === 'api-key' && <Key size={11} />}
              {value === 'basic' && <User size={11} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Auth Fields */}
      {auth.type === 'none' && (
        <div className="py-6 text-center text-slate-600 text-sm">
          <Lock className="mx-auto mb-2 text-slate-700" size={24} />
          This request does not use any authentication.
        </div>
      )}

      {auth.type === 'bearer' && (
        <div>
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">Bearer Token</label>
          <input
            type="text"
            value={auth.bearerToken || ''}
            onChange={e => update({ bearerToken: e.target.value })}
            placeholder="Enter your bearer token..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <p className="text-[11px] text-slate-600 mt-1.5">Will be sent as: <code className="text-slate-500">Authorization: Bearer &lt;token&gt;</code></p>
        </div>
      )}

      {auth.type === 'basic' && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Username</label>
            <input
              type="text"
              value={auth.basicUsername || ''}
              onChange={e => update({ basicUsername: e.target.value })}
              placeholder="username"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Password</label>
            <input
              type="password"
              value={auth.basicPassword || ''}
              onChange={e => update({ basicPassword: e.target.value })}
              placeholder="password"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {auth.type === 'api-key' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Key Name</label>
              <input
                type="text"
                value={auth.apiKeyName || ''}
                onChange={e => update({ apiKeyName: e.target.value })}
                placeholder="X-API-Key"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Add to</label>
              <select
                value={auth.apiKeyIn || 'header'}
                onChange={e => update({ apiKeyIn: e.target.value as 'header' | 'query' })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="header">Header</option>
                <option value="query">Query Param</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Key Value</label>
            <input
              type="text"
              value={auth.apiKeyValue || ''}
              onChange={e => update({ apiKeyValue: e.target.value })}
              placeholder="your-api-key-here"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
};
