import React from 'react';
import { KeyValuePair } from '../../types';
import { Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  disabled?: boolean;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  pairs,
  onChange,
  keyPlaceholder = 'key',
  valuePlaceholder = 'value',
  disabled = false,
}) => {
  const updatePair = (id: string, field: keyof KeyValuePair, value: string | boolean) => {
    onChange(pairs.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePair = (id: string) => {
    onChange(pairs.filter(p => p.id !== id));
  };

  if (pairs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-600 text-sm">
        No items. Add one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Column headers */}
      <div className="grid grid-cols-[20px_1fr_1fr_28px] gap-2 px-1">
        <div />
        <div className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Key</div>
        <div className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Value</div>
        <div />
      </div>

      {pairs.map(pair => (
        <div key={pair.id} className="grid grid-cols-[20px_1fr_1fr_28px] gap-2 items-center group">
          <input
            type="checkbox"
            checked={pair.enabled}
            onChange={e => updatePair(pair.id, 'enabled', e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
          />
          <input
            type="text"
            value={pair.key}
            onChange={e => updatePair(pair.id, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            disabled={disabled}
            className={cn(
              'px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition-opacity',
              !pair.enabled && 'opacity-40'
            )}
          />
          <input
            type="text"
            value={pair.value}
            onChange={e => updatePair(pair.id, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            disabled={disabled}
            className={cn(
              'px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition-opacity',
              !pair.enabled && 'opacity-40'
            )}
          />
          <button
            onClick={() => removePair(pair.id)}
            disabled={disabled}
            className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};
