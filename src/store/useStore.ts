import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  SavedEndpoint,
  Collection,
  HealthCheck,
  Alert,
  HttpMethod,
  KeyValuePair,
  Auth,
  CheckStatus,
} from '../types';
import { subDays } from 'date-fns';

interface ActiveRequest {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  body: string;
  bodyType: 'json' | 'form' | 'text' | 'none';
  auth: Auth;
  name: string;
  description: string;
  collectionId?: string;
  tags: string[];
  monitoringEnabled: boolean;
  cronExpression: string;
  expectedStatusCode: number;
  alertEmail: string;
}

interface RequestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
  size: number;
  timestamp: string;
}

interface SyncAPIStore {
  // Navigation
  activeTab: 'client' | 'collections' | 'monitor' | 'dashboard' | 'alerts';
  setActiveTab: (tab: 'client' | 'collections' | 'monitor' | 'dashboard' | 'alerts') => void;

  // Active Request State
  activeRequest: ActiveRequest;
  updateActiveRequest: (updates: Partial<ActiveRequest>) => void;
  loadEndpointToClient: (endpoint: SavedEndpoint) => void;
  resetActiveRequest: () => void;

  // Response State
  response: RequestResponse | null;
  isLoading: boolean;
  setResponse: (response: RequestResponse | null) => void;
  setIsLoading: (loading: boolean) => void;

  // Saved Endpoints
  endpoints: SavedEndpoint[];
  saveEndpoint: (endpoint?: Partial<SavedEndpoint>) => void;
  updateEndpoint: (id: string, updates: Partial<SavedEndpoint>) => void;
  deleteEndpoint: (id: string) => void;
  duplicateEndpoint: (id: string) => void;
  selectedEndpointId: string | null;
  setSelectedEndpointId: (id: string | null) => void;

  // Collections
  collections: Collection[];
  addCollection: (name: string, description?: string, color?: string) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;

  // Health Checks
  healthChecks: HealthCheck[];
  addHealthCheck: (check: Omit<HealthCheck, 'id'>) => void;
  clearHealthChecks: (endpointId: string) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id'>) => void;
  acknowledgeAlert: (id: string) => void;
  clearAlerts: () => void;

  // Monitor
  monitorIntervals: Record<string, NodeJS.Timeout>;
  startMonitoring: (endpointId: string) => void;
  stopMonitoring: (endpointId: string) => void;
  runHealthCheck: (endpointId: string) => Promise<void>;
  isMonitorRunning: (endpointId: string) => boolean;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const defaultRequest: ActiveRequest = {
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/posts',
  headers: [{ id: uuidv4(), key: 'Content-Type', value: 'application/json', enabled: true }],
  queryParams: [],
  body: '',
  bodyType: 'json',
  auth: { type: 'none' },
  name: '',
  description: '',
  collectionId: undefined,
  tags: [],
  monitoringEnabled: false,
  cronExpression: '*/5 * * * *',
  expectedStatusCode: 200,
  alertEmail: '',
};

const COLLECTION_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function getCronMs(expression: string): number {
  // Parse simple cron: */N * * * * → N minutes
  const parts = expression.trim().split(' ');
  if (parts.length >= 1) {
    const first = parts[0];
    if (first.startsWith('*/')) {
      const mins = parseInt(first.slice(2));
      if (!isNaN(mins)) return mins * 60 * 1000;
    }
    if (!isNaN(parseInt(first))) {
      return 60 * 1000;
    }
  }
  return 5 * 60 * 1000; // default 5 mins
}

async function executeRequest(endpoint: SavedEndpoint): Promise<{
  status: number;
  statusText: string;
  duration: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    let url = endpoint.url;
    const enabledParams = endpoint.queryParams.filter(p => p.enabled && p.key);
    if (enabledParams.length > 0) {
      const params = new URLSearchParams();
      enabledParams.forEach(p => params.append(p.key, p.value));
      url += (url.includes('?') ? '&' : '?') + params.toString();
    }

    const headers: Record<string, string> = {};
    endpoint.headers.filter(h => h.enabled && h.key).forEach(h => {
      headers[h.key] = h.value;
    });

    if (endpoint.auth.type === 'bearer' && endpoint.auth.bearerToken) {
      headers['Authorization'] = `Bearer ${endpoint.auth.bearerToken}`;
    } else if (endpoint.auth.type === 'basic') {
      const creds = btoa(`${endpoint.auth.basicUsername}:${endpoint.auth.basicPassword}`);
      headers['Authorization'] = `Basic ${creds}`;
    } else if (endpoint.auth.type === 'api-key' && endpoint.auth.apiKeyIn === 'header') {
      headers[endpoint.auth.apiKeyName || 'X-API-Key'] = endpoint.auth.apiKeyValue || '';
    }

    const fetchOptions: RequestInit = {
      method: endpoint.method,
      headers,
    };

    if (!['GET', 'HEAD'].includes(endpoint.method) && endpoint.body) {
      fetchOptions.body = endpoint.body;
    }

    const res = await fetch(url, fetchOptions);
    const duration = Date.now() - start;
    return { status: res.status, statusText: res.statusText, duration };
  } catch (err: unknown) {
    const duration = Date.now() - start;
    return { status: 0, statusText: 'Network Error', duration, error: String(err) };
  }
}

// Generate mock historical data for seeded endpoints
function generateMockHealthChecks(endpointId: string, baseUptime: number): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const now = new Date();
  for (let i = 0; i < 50; i++) {
    const ts = new Date(now.getTime() - (50 - i) * 30 * 60 * 1000);
    const isUp = Math.random() * 100 < baseUptime;
    checks.push({
      id: uuidv4(),
      endpointId,
      timestamp: ts.toISOString(),
      status: isUp ? 'up' : 'down',
      statusCode: isUp ? 200 : 500,
      duration: isUp ? Math.floor(100 + Math.random() * 400) : 0,
      error: isUp ? undefined : 'Connection refused',
    });
  }
  return checks;
}

const seedCollections: Collection[] = [
  { id: 'col-1', name: 'JSONPlaceholder', description: 'Free fake API for testing', color: '#6366f1', createdAt: new Date().toISOString() },
  { id: 'col-2', name: 'GitHub API', description: 'GitHub REST API v3', color: '#8b5cf6', createdAt: new Date().toISOString() },
  { id: 'col-3', name: 'Production', description: 'Live production endpoints', color: '#ef4444', createdAt: new Date().toISOString() },
];

const seedEndpoints: SavedEndpoint[] = [
  {
    id: 'ep-1', name: 'Get All Posts', url: 'https://jsonplaceholder.typicode.com/posts', method: 'GET',
    headers: [{ id: uuidv4(), key: 'Content-Type', value: 'application/json', enabled: true }],
    queryParams: [], body: '', bodyType: 'json', auth: { type: 'none' }, collectionId: 'col-1',
    tags: ['posts', 'read'], createdAt: subDays(new Date(), 10).toISOString(), updatedAt: new Date().toISOString(),
    description: 'Fetch all blog posts', monitoringEnabled: true, cronExpression: '*/5 * * * *',
    expectedStatusCode: 200, alertEmail: 'admin@example.com',
  },
  {
    id: 'ep-2', name: 'Get Post by ID', url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'GET',
    headers: [{ id: uuidv4(), key: 'Content-Type', value: 'application/json', enabled: true }],
    queryParams: [], body: '', bodyType: 'json', auth: { type: 'none' }, collectionId: 'col-1',
    tags: ['posts', 'read'], createdAt: subDays(new Date(), 9).toISOString(), updatedAt: new Date().toISOString(),
    description: 'Fetch a single post', monitoringEnabled: false, cronExpression: '*/10 * * * *',
    expectedStatusCode: 200, alertEmail: '',
  },
  {
    id: 'ep-3', name: 'Create Post', url: 'https://jsonplaceholder.typicode.com/posts', method: 'POST',
    headers: [{ id: uuidv4(), key: 'Content-Type', value: 'application/json', enabled: true }],
    queryParams: [], body: JSON.stringify({ title: 'foo', body: 'bar', userId: 1 }, null, 2), bodyType: 'json',
    auth: { type: 'none' }, collectionId: 'col-1', tags: ['posts', 'write'],
    createdAt: subDays(new Date(), 8).toISOString(), updatedAt: new Date().toISOString(),
    description: 'Create a new post', monitoringEnabled: false, cronExpression: '*/5 * * * *',
    expectedStatusCode: 201, alertEmail: '',
  },
  {
    id: 'ep-4', name: 'Get Users', url: 'https://jsonplaceholder.typicode.com/users', method: 'GET',
    headers: [{ id: uuidv4(), key: 'Accept', value: 'application/json', enabled: true }],
    queryParams: [], body: '', bodyType: 'json', auth: { type: 'none' }, collectionId: 'col-1',
    tags: ['users'], createdAt: subDays(new Date(), 7).toISOString(), updatedAt: new Date().toISOString(),
    description: 'List all users', monitoringEnabled: true, cronExpression: '*/15 * * * *',
    expectedStatusCode: 200, alertEmail: 'ops@example.com',
  },
  {
    id: 'ep-5', name: 'GitHub Repos', url: 'https://api.github.com/users/octocat/repos', method: 'GET',
    headers: [{ id: uuidv4(), key: 'Accept', value: 'application/vnd.github.v3+json', enabled: true }],
    queryParams: [{ id: uuidv4(), key: 'per_page', value: '10', enabled: true }], body: '', bodyType: 'none',
    auth: { type: 'bearer', bearerToken: 'ghp_yourtoken' }, collectionId: 'col-2', tags: ['github'],
    createdAt: subDays(new Date(), 6).toISOString(), updatedAt: new Date().toISOString(),
    description: 'List repos for octocat', monitoringEnabled: true, cronExpression: '*/30 * * * *',
    expectedStatusCode: 200, alertEmail: 'dev@example.com',
  },
  {
    id: 'ep-6', name: 'Update Post', url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'PUT',
    headers: [{ id: uuidv4(), key: 'Content-Type', value: 'application/json', enabled: true }],
    queryParams: [], body: JSON.stringify({ id: 1, title: 'updated title', body: 'updated body', userId: 1 }, null, 2),
    bodyType: 'json', auth: { type: 'none' }, collectionId: 'col-1', tags: ['posts', 'write'],
    createdAt: subDays(new Date(), 5).toISOString(), updatedAt: new Date().toISOString(),
    description: 'Update a post', monitoringEnabled: false, cronExpression: '*/5 * * * *',
    expectedStatusCode: 200, alertEmail: '',
  },
  {
    id: 'ep-7', name: 'Delete Post', url: 'https://jsonplaceholder.typicode.com/posts/1', method: 'DELETE',
    headers: [], queryParams: [], body: '', bodyType: 'none', auth: { type: 'none' }, collectionId: 'col-1',
    tags: ['posts', 'write'], createdAt: subDays(new Date(), 4).toISOString(), updatedAt: new Date().toISOString(),
    description: 'Delete a post', monitoringEnabled: false, cronExpression: '*/5 * * * *',
    expectedStatusCode: 200, alertEmail: '',
  },
  {
    id: 'ep-8', name: 'Get Comments', url: 'https://jsonplaceholder.typicode.com/comments', method: 'GET',
    headers: [{ id: uuidv4(), key: 'Accept', value: 'application/json', enabled: true }],
    queryParams: [{ id: uuidv4(), key: 'postId', value: '1', enabled: true }], body: '', bodyType: 'none',
    auth: { type: 'none' }, collectionId: 'col-1', tags: ['comments'],
    createdAt: subDays(new Date(), 3).toISOString(), updatedAt: new Date().toISOString(),
    description: 'Get comments for a post', monitoringEnabled: false, cronExpression: '*/5 * * * *',
    expectedStatusCode: 200, alertEmail: '',
  },
];

export const useStore = create<SyncAPIStore>()(
  persist(
    (set, get) => ({
      activeTab: 'client',
      setActiveTab: (tab) => set({ activeTab: tab }),

      activeRequest: { ...defaultRequest },
      updateActiveRequest: (updates) =>
        set((state) => ({ activeRequest: { ...state.activeRequest, ...updates } })),
      loadEndpointToClient: (endpoint) =>
        set({
          activeRequest: {
            method: endpoint.method,
            url: endpoint.url,
            headers: endpoint.headers.length ? endpoint.headers : [{ id: uuidv4(), key: '', value: '', enabled: true }],
            queryParams: endpoint.queryParams,
            body: endpoint.body,
            bodyType: endpoint.bodyType,
            auth: endpoint.auth,
            name: endpoint.name,
            description: endpoint.description || '',
            collectionId: endpoint.collectionId,
            tags: endpoint.tags,
            monitoringEnabled: endpoint.monitoringEnabled,
            cronExpression: endpoint.cronExpression,
            expectedStatusCode: endpoint.expectedStatusCode,
            alertEmail: endpoint.alertEmail || '',
          },
          selectedEndpointId: endpoint.id,
          activeTab: 'client',
        }),
      resetActiveRequest: () => set({ activeRequest: { ...defaultRequest }, selectedEndpointId: null, response: null }),

      response: null,
      isLoading: false,
      setResponse: (response) => set({ response }),
      setIsLoading: (isLoading) => set({ isLoading }),

      endpoints: seedEndpoints,
      selectedEndpointId: null,
      setSelectedEndpointId: (id) => set({ selectedEndpointId: id }),
      saveEndpoint: (overrides = {}) => {
        const { activeRequest, selectedEndpointId, endpoints } = get();
        if (selectedEndpointId) {
          const existing = endpoints.find(e => e.id === selectedEndpointId);
          if (existing) {
            set((state) => ({
              endpoints: state.endpoints.map(e =>
                e.id === selectedEndpointId
                  ? { ...e, ...activeRequest, ...overrides, updatedAt: new Date().toISOString() }
                  : e
              ),
            }));
            return;
          }
        }
        const newEndpoint: SavedEndpoint = {
          id: uuidv4(),
          name: activeRequest.name || 'Untitled Request',
          url: activeRequest.url,
          method: activeRequest.method,
          headers: activeRequest.headers,
          queryParams: activeRequest.queryParams,
          body: activeRequest.body,
          bodyType: activeRequest.bodyType,
          auth: activeRequest.auth,
          collectionId: activeRequest.collectionId,
          tags: activeRequest.tags,
          description: activeRequest.description,
          monitoringEnabled: activeRequest.monitoringEnabled,
          cronExpression: activeRequest.cronExpression,
          expectedStatusCode: activeRequest.expectedStatusCode,
          alertEmail: activeRequest.alertEmail,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...overrides,
        };
        set((state) => ({
          endpoints: [...state.endpoints, newEndpoint],
          selectedEndpointId: newEndpoint.id,
        }));
      },
      updateEndpoint: (id, updates) =>
        set((state) => ({
          endpoints: state.endpoints.map(e =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
        })),
      deleteEndpoint: (id) => {
        get().stopMonitoring(id);
        set((state) => ({
          endpoints: state.endpoints.filter(e => e.id !== id),
          selectedEndpointId: state.selectedEndpointId === id ? null : state.selectedEndpointId,
        }));
      },
      duplicateEndpoint: (id) => {
        const endpoint = get().endpoints.find(e => e.id === id);
        if (!endpoint) return;
        const newEndpoint: SavedEndpoint = {
          ...endpoint,
          id: uuidv4(),
          name: `${endpoint.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          monitoringEnabled: false,
        };
        set((state) => ({ endpoints: [...state.endpoints, newEndpoint] }));
      },

      collections: seedCollections,
      addCollection: (name, description, color) => {
        const newCol: Collection = {
          id: uuidv4(),
          name,
          description,
          color: color || COLLECTION_COLORS[Math.floor(Math.random() * COLLECTION_COLORS.length)],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ collections: [...state.collections, newCol] }));
      },
      updateCollection: (id, updates) =>
        set((state) => ({
          collections: state.collections.map(c => c.id === id ? { ...c, ...updates } : c),
        })),
      deleteCollection: (id) =>
        set((state) => ({ collections: state.collections.filter(c => c.id !== id) })),

      healthChecks: [
        ...generateMockHealthChecks('ep-1', 97),
        ...generateMockHealthChecks('ep-4', 99),
        ...generateMockHealthChecks('ep-5', 85),
      ],
      addHealthCheck: (check) =>
        set((state) => ({
          healthChecks: [...state.healthChecks, { ...check, id: uuidv4() }].slice(-500),
        })),
      clearHealthChecks: (endpointId) =>
        set((state) => ({
          healthChecks: state.healthChecks.filter(c => c.endpointId !== endpointId),
        })),

      alerts: [
        {
          id: uuidv4(), endpointId: 'ep-5', endpointName: 'GitHub Repos',
          timestamp: subDays(new Date(), 1).toISOString(),
          message: 'Endpoint returned 401 Unauthorized (expected 200)', type: 'down', acknowledged: false,
        },
        {
          id: uuidv4(), endpointId: 'ep-1', endpointName: 'Get All Posts',
          timestamp: subDays(new Date(), 2).toISOString(),
          message: 'Response time exceeded 2000ms threshold', type: 'slow', acknowledged: true,
        },
      ],
      addAlert: (alert) =>
        set((state) => ({ alerts: [{ ...alert, id: uuidv4() }, ...state.alerts].slice(0, 100) })),
      acknowledgeAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a),
        })),
      clearAlerts: () => set({ alerts: [] }),

      monitorIntervals: {},
      isMonitorRunning: (endpointId) => !!get().monitorIntervals[endpointId],

      startMonitoring: (endpointId) => {
        const { monitorIntervals, endpoints, runHealthCheck } = get();
        if (monitorIntervals[endpointId]) return;

        const endpoint = endpoints.find(e => e.id === endpointId);
        if (!endpoint) return;

        const ms = getCronMs(endpoint.cronExpression);
        runHealthCheck(endpointId);
        const interval = setInterval(() => {
          runHealthCheck(endpointId);
        }, ms);

        set((state) => ({
          monitorIntervals: { ...state.monitorIntervals, [endpointId]: interval },
        }));
      },

      stopMonitoring: (endpointId) => {
        const { monitorIntervals } = get();
        if (monitorIntervals[endpointId]) {
          clearInterval(monitorIntervals[endpointId]);
          const updated = { ...monitorIntervals };
          delete updated[endpointId];
          set({ monitorIntervals: updated });
        }
      },

      runHealthCheck: async (endpointId) => {
        const { endpoints, addHealthCheck, addAlert } = get();
        const endpoint = endpoints.find(e => e.id === endpointId);
        if (!endpoint) return;

        const result = await executeRequest(endpoint);
        const isUp = result.status === endpoint.expectedStatusCode;
        const status: CheckStatus = result.status === 0 ? 'down' : isUp ? 'up' : 'degraded';

        const check: Omit<HealthCheck, 'id'> = {
          endpointId,
          timestamp: new Date().toISOString(),
          status,
          statusCode: result.status,
          duration: result.duration,
          error: result.error,
        };
        addHealthCheck(check);

        if (status !== 'up') {
          addAlert({
            endpointId,
            endpointName: endpoint.name,
            timestamp: new Date().toISOString(),
            message: result.error
              ? `Network error: ${result.error}`
              : `Returned ${result.status} (expected ${endpoint.expectedStatusCode})`,
            type: status === 'down' ? 'down' : 'error',
            acknowledged: false,
          });
        }
      },

      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'syncapi-storage',
      partialize: (state) => ({
        endpoints: state.endpoints,
        collections: state.collections,
        healthChecks: state.healthChecks,
        alerts: state.alerts,
      }),
    }
  )
);
