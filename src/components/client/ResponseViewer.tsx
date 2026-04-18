import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { StatusCodeBadge } from '../ui/StatusBadge';
import { Clock, HardDrive, Copy, Check, ChevronDown, ChevronRight, Braces } from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const TABS = ['Body', 'Headers'];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function isJSON(str: string): boolean {
  try { JSON.parse(str); return true; } catch { return false; }
}

// Interactive JSON Tree
const JsonNode: React.FC<{ data: unknown; depth?: number }> = ({ data, depth = 0 }) => {
  const [collapsed, setCollapsed] = useState(depth > 2);

  if (data === null) return <span className="text-slate-500 font-mono text-xs">null</span>;
  if (typeof data === 'boolean') return <span className="text-violet-400 font-mono text-xs">{data.toString()}</span>;
  if (typeof data === 'number') return <span className="text-amber-400 font-mono text-xs">{data}</span>;
  if (typeof data === 'string') return <span className="text-emerald-400 font-mono text-xs">"{data}"</span>;

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-slate-400 font-mono text-xs">[]</span>;
    return (
      <span>
        <button onClick={() => setCollapsed(!collapsed)} className="text-slate-500 hover:text-slate-300 transition-colors">
          {collapsed ? <ChevronRight size={12} className="inline" /> : <ChevronDown size={12} className="inline" />}
        </button>
        <span className="text-slate-400 font-mono text-xs ml-0.5">[</span>
        {collapsed ? (
          <span className="text-slate-500 font-mono text-xs"> {data.length} items </span>
        ) : (
          <div className="ml-4 border-l border-slate-800 pl-3 mt-0.5">
            {data.map((item, i) => (
              <div key={i} className="my-0.5">
                <span className="text-slate-600 font-mono text-xs">{i}: </span>
                <JsonNode data={item} depth={depth + 1} />
                {i < data.length - 1 && <span className="text-slate-600">,</span>}
              </div>
            ))}
          </div>
        )}
        <span className="text-slate-400 font-mono text-xs">{collapsed ? '' : ''}]</span>
      </span>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data as Record<string, unknown>);
    if (keys.length === 0) return <span className="text-slate-400 font-mono text-xs">{'{}'}</span>;
    return (
      <span>
        <button onClick={() => setCollapsed(!collapsed)} className="text-slate-500 hover:text-slate-300 transition-colors">
          {collapsed ? <ChevronRight size={12} className="inline" /> : <ChevronDown size={12} className="inline" />}
        </button>
        <span className="text-slate-400 font-mono text-xs ml-0.5">{'{'}</span>
        {collapsed ? (
          <span className="text-slate-500 font-mono text-xs"> {keys.length} keys </span>
        ) : (
          <div className="ml-4 border-l border-slate-800 pl-3 mt-0.5">
            {keys.map((key, i) => (
              <div key={key} className="my-0.5">
                <span className="text-blue-400 font-mono text-xs">"{key}"</span>
                <span className="text-slate-400 font-mono text-xs">: </span>
                <JsonNode data={(data as Record<string, unknown>)[key]} depth={depth + 1} />
                {i < keys.length - 1 && <span className="text-slate-600">,</span>}
              </div>
            ))}
          </div>
        )}
        <span className="text-slate-400 font-mono text-xs">{'}'}</span>
      </span>
    );
  }

  return <span className="text-slate-300 font-mono text-xs">{String(data)}</span>;
};

export const ResponseViewer: React.FC = () => {
  const { response, isLoading } = useStore();
  const [activeTab, setActiveTab] = useState('Body');
  const [viewMode, setViewMode] = useState<'pretty' | 'raw' | 'tree'>('pretty');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Sending request...</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
            <Braces className="text-slate-600" size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">No Response Yet</p>
            <p className="text-slate-600 text-xs mt-1">Send a request to see the response here</p>
          </div>
        </div>
      </div>
    );
  }

  const isJson = isJSON(response.body);
  const parsedJson = isJson ? JSON.parse(response.body) : null;
  const isSuccess = response.status >= 200 && response.status < 300;
  const isError = response.status >= 400 || response.status === 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Response Meta Bar */}
      <div className={cn(
        'px-4 py-2.5 border-b flex items-center gap-4 flex-wrap',
        isSuccess ? 'bg-emerald-950/30 border-emerald-900/40' :
        isError ? 'bg-red-950/30 border-red-900/40' : 'bg-slate-900 border-slate-800'
      )}>
        <StatusCodeBadge code={response.status} />
        <span className={cn(
          'text-xs font-medium',
          isSuccess ? 'text-emerald-400' : isError ? 'text-red-400' : 'text-slate-400'
        )}>
          {response.statusText || (response.status === 0 ? 'Network Error' : 'OK')}
        </span>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock size={11} />
          <span>{formatDuration(response.duration)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <HardDrive size={11} />
          <span>{formatBytes(response.size)}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isJson && (
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
              {(['pretty', 'tree', 'raw'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-medium rounded-md transition-all capitalize',
                    viewMode === mode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-all"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-900 px-3">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-xs font-medium border-b-2 transition-all',
              activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            )}
          >
            {tab}
            {tab === 'Headers' && (
              <span className="ml-1.5 bg-slate-700 text-slate-400 text-[9px] px-1.5 rounded-full">
                {Object.keys(response.headers).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-950/50">
        {activeTab === 'Body' && (
          <div className="p-3">
            {viewMode === 'tree' && isJson ? (
              <div className="font-mono text-xs leading-relaxed">
                <JsonNode data={parsedJson} />
              </div>
            ) : viewMode === 'pretty' && isJson ? (
              <SyntaxHighlighter
                language="json"
                style={atomOneDark}
                customStyle={{
                  background: 'transparent',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  padding: 0,
                  margin: 0,
                }}
                showLineNumbers
                lineNumberStyle={{ color: '#374151', fontSize: '11px', minWidth: '2.5em' }}
              >
                {response.body}
              </SyntaxHighlighter>
            ) : (
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                {response.body}
              </pre>
            )}
          </div>
        )}

        {activeTab === 'Headers' && (
          <div className="p-3">
            <div className="space-y-1">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex items-start gap-3 py-1.5 border-b border-slate-800/50 group">
                  <span className="text-xs font-mono text-blue-400 min-w-[180px] shrink-0">{key}</span>
                  <span className="text-xs font-mono text-slate-300 break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
