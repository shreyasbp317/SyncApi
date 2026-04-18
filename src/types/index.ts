export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type AuthType = 'none' | 'bearer' | 'basic' | 'api-key';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Auth {
  type: AuthType;
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyIn?: 'header' | 'query';
}

export interface SavedEndpoint {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  body: string;
  bodyType: 'json' | 'form' | 'text' | 'none';
  auth: Auth;
  collectionId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  description?: string;
  monitoringEnabled: boolean;
  cronExpression: string;
  expectedStatusCode: number;
  alertEmail?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
}

export interface RequestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
  size: number;
  timestamp: string;
}

export type CheckStatus = 'up' | 'down' | 'degraded' | 'unknown';

export interface HealthCheck {
  id: string;
  endpointId: string;
  timestamp: string;
  status: CheckStatus;
  statusCode: number;
  duration: number;
  error?: string;
}

export interface UptimeStat {
  date: string;
  uptime: number;
  avgResponseTime: number;
  checks: number;
  failures: number;
}

export interface Alert {
  id: string;
  endpointId: string;
  endpointName: string;
  timestamp: string;
  message: string;
  type: 'down' | 'slow' | 'error';
  acknowledged: boolean;
}

export interface MonitorStats {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  avgResponseTime: number;
  uptime: number;
  lastChecked: string | null;
  currentStatus: CheckStatus;
}
