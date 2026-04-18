import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { cn } from '../../utils/cn';
import { MethodBadge } from '../ui/MethodBadge';
import { KeyValueEditor } from './KeyValueEditor';
import { AuthEditor } from './AuthEditor';
import { HttpMethod, KeyValuePair } from '../../types';
import {
  ChevronDown,
  Send,
  Save,
  RotateCcw,
  Plus,
  Loader2,
  Lock,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const TABS = ['Params', 'Headers', 'Body', 'Auth'];

export const RequestBuilder: React.FC = () => {
  const {
    activeRequest,
    updateActiveRequest,
    setIsLoading,
    setResponse,
    isLoading,
    saveEndpoint,
    resetActiveRequest,
    selectedEndpointId,
    endpoints,
  } = useStore();

  const [activeTab, setActiveTab] = useState('Params');
  const [showMethodMenu, setShowMethodMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleSend = async () => {
    if (!activeRequest.url) return;
    setIsLoading(true);
    setResponse(null);

    try {
      let url = activeRequest.url;
      const enabledParams = activeRequest.queryParams.filter(p => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const params = new URLSearchParams();
        enabledParams.forEach(p => params.append(p.key, p.value));
        url += (url.includes('?') ? '&' : '?') + params.toString();
      }

      const headers: Record<string, string> = {};
      activeRequest.headers.filter(h => h.enabled && h.key).forEach(h => {
        headers[h.key] = h.value;
      });

      if (activeRequest.auth.type === 'bearer' && activeRequest.auth.bearerToken) {
        headers['Authorization'] = `Bearer ${activeRequest.auth.bearerToken}`;
      } else if (activeRequest.auth.type === 'basic') {
        const creds = btoa(`${activeRequest.auth.basicUsername}:${activeRequest.auth.basicPassword}`);
        headers['Authorization'] = `Basic ${creds}`;
      } else if (activeRequest.auth.type === 'api-key' && activeRequest.auth.apiKeyIn === 'header') {
        headers[activeRequest.auth.apiKeyName || 'X-API-Key'] = activeRequest.auth.apiKeyValue || '';
      }

      const start = Date.now();
      const fetchOptions: RequestInit = { method: activeRequest.method, headers };

      if (!['GET', 'HEAD'].includes(activeRequest.method) && activeRequest.body && activeRequest.bodyType !== 'none') {
        fetchOptions.body = activeRequest.body;
      }

      const res = await fetch(url, fetchOptions);
      const duration = Date.now() - start;

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => { resHeaders[key] = value; });

      const rawBody = await res.text();
      let body = rawBody;

      // Try to format JSON
      try {
        const parsed = JSON.parse(rawBody);
        body = JSON.stringify(parsed, null, 2);
      } catch {
        // Not JSON
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body,
        duration,
        size: new Blob([rawBody]).size,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: String(err),
        duration: 0,
        size: 0,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addQueryParam = () => {
    updateActiveRequest({
      queryParams: [...activeRequest.queryParams, { id: uuidv4(), key: '', value: '', enabled: true }],
    });
  };

  const addHeader = () => {
    updateActiveRequest({
      headers: [...activeRequest.headers, { id: uuidv4(), key: '', value: '', enabled: true }],
    });
  };

  const enabledParamsCount = activeRequest.queryParams.filter(p => p.enabled && p.key).length;
  const enabledHeadersCount = activeRequest.headers.filter(h => h.enabled && h.key).length;

  const currentEndpointName = selectedEndpointId
    ? endpoints.find(e => e.id === selectedEndpointId)?.name || 'Untitled'
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* URL Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-900">
        {currentEndpointName && (
          <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
            <Save size={11} />
            Editing: <span className="text-indigo-400 font-medium">{currentEndpointName}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {/* Method Selector */}
          <div className="relative">
            <button
              onClick={() => setShowMethodMenu(!showMethodMenu)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 transition-all"
            >
              <MethodBadge method={activeRequest.method} size="sm" />
              <ChevronDown size={12} className="text-slate-400" />
            </button>
            {showMethodMenu && (
              <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 min-w-[100px]">
                {METHODS.map(m => (
                  <button
                    key={m}
                    onClick={() => { updateActiveRequest({ method: m }); setShowMethodMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-700 transition-colors"
                  >
                    <MethodBadge method={m} size="xs" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* URL Input */}
          <input
            type="text"
            value={activeRequest.url}
            onChange={e => updateActiveRequest({ url: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="https://api.example.com/endpoint"
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-mono"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isLoading || !activeRequest.url}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-all"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {isLoading ? 'Sending...' : 'Send'}
          </button>

          {/* Save Button */}
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm rounded-lg transition-all"
          >
            <Save size={14} />
            <span className="hidden sm:block">Save</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={resetActiveRequest}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 rounded-lg transition-all"
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-slate-800 bg-slate-900 px-3">
        {TABS.map(tab => {
          const count = tab === 'Params' ? enabledParamsCount : tab === 'Headers' ? enabledHeadersCount : 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-all',
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              )}
            >
              {tab === 'Auth' && <Lock size={11} />}
              {tab}
              {count > 0 && (
                <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-slate-950/50">
        {activeTab === 'Params' && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Query Parameters</span>
              <button
                onClick={addQueryParam}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            </div>
            <KeyValueEditor
              pairs={activeRequest.queryParams}
              onChange={pairs => updateActiveRequest({ queryParams: pairs as KeyValuePair[] })}
              keyPlaceholder="parameter"
              valuePlaceholder="value"
            />
          </div>
        )}

        {activeTab === 'Headers' && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Request Headers</span>
              <button
                onClick={addHeader}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Plus size={12} /> Add
              </button>
            </div>
            <KeyValueEditor
              pairs={activeRequest.headers}
              onChange={pairs => updateActiveRequest({ headers: pairs as KeyValuePair[] })}
              keyPlaceholder="Header-Name"
              valuePlaceholder="value"
            />
          </div>
        )}

        {activeTab === 'Body' && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Body Type</span>
              <div className="flex gap-1">
                {(['none', 'json', 'text', 'form'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => updateActiveRequest({ bodyType: type })}
                    className={cn(
                      'px-3 py-1 text-xs rounded-lg font-medium transition-all',
                      activeRequest.bodyType === type
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {type === 'none' ? 'None' : type === 'json' ? 'JSON' : type === 'text' ? 'Text' : 'Form'}
                  </button>
                ))}
              </div>
            </div>
            {activeRequest.bodyType !== 'none' && (
              <textarea
                value={activeRequest.body}
                onChange={e => updateActiveRequest({ body: e.target.value })}
                placeholder={activeRequest.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Request body...'}
                className="w-full h-56 px-3 py-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono resize-none"
              />
            )}
          </div>
        )}

        {activeTab === 'Auth' && (
          <div className="p-3">
            <AuthEditor
              auth={activeRequest.auth}
              onChange={auth => updateActiveRequest({ auth })}
            />
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <SaveModal
          onClose={() => setShowSaveModal(false)}
          onSave={() => { saveEndpoint(); setShowSaveModal(false); }}
        />
      )}
    </div>
  );
};

const SaveModal: React.FC<{ onClose: () => void; onSave: () => void }> = ({ onClose, onSave }) => {
  const { activeRequest, updateActiveRequest, collections } = useStore();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">Save Request</h2>
          <p className="text-xs text-slate-400 mt-1">Save this request to your collections</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Request Name *</label>
            <input
              type="text"
              value={activeRequest.name}
              onChange={e => updateActiveRequest({ name: e.target.value })}
              placeholder="e.g., Get User Profile"
              autoFocus
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Description</label>
            <input
              type="text"
              value={activeRequest.description}
              onChange={e => updateActiveRequest({ description: e.target.value })}
              placeholder="What does this request do?"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Collection</label>
            <select
              value={activeRequest.collectionId || ''}
              onChange={e => updateActiveRequest({ collectionId: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">No Collection</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!activeRequest.name}
            className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-all"
          >
            Save Request
          </button>
        </div>
      </div>
    </div>
  );
};
