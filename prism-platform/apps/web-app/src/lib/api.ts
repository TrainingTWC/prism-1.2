const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// ── Supabase PostgREST fallback for static deployments (no API server) ──

const ROUTE_TABLE_MAP: Record<string, { table: string; select?: string; orderBy?: string }> = {
  '/api/programs': {
    table: 'program',
    select: '*,sections:program_section(id,title,order,weight),submission_count:program_submission(count)',
    orderBy: 'updated_at.desc',
  },
  '/api/employees': {
    table: 'employee',
    select: '*,store:store_id(store_name,store_code,region:region_id(name)),role:role_id(id,name)',
    orderBy: 'name.asc',
  },
  '/api/stores': {
    table: 'store',
    select: '*,region:region_id(id,name)',
    orderBy: 'store_name.asc',
  },
  '/api/submissions': {
    table: 'program_submission',
    select: '*,program:program_id(id,name,type),store:store_id(store_name,store_code,region:region_id(name)),employee:employee_id(name,emp_id)',
    orderBy: 'created_at.desc',
  },
  '/api/tasks': {
    table: 'task',
    select: '*',
    orderBy: 'created_at.desc',
  },
  '/api/follow-ups': {
    table: 'follow_up',
    select: '*',
    orderBy: 'created_at.desc',
  },
  '/api/notifications': {
    table: 'notification',
    select: '*',
    orderBy: 'created_at.desc',
  },
};

/** Convert camelCase query key to snake_case */
function toSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** Convert snake_case to camelCase */
function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Recursively convert object keys from snake_case to camelCase */
function camelizeKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(camelizeKeys);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [toCamel(k), camelizeKeys(v)]),
    );
  }
  return obj;
}

/** Try to serve a GET request via Supabase PostgREST */
async function supabaseGet<T>(endpoint: string): Promise<T | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const [path, queryString] = endpoint.split('?');

  // Check for single-resource route like /api/programs/:id
  let routeConfig = ROUTE_TABLE_MAP[path];
  let singleId: string | null = null;

  if (!routeConfig) {
    // Try matching /api/<resource>/<id>
    const match = path.match(/^(\/api\/[a-z-]+)\/([0-9a-f-]{36})$/);
    if (match) {
      routeConfig = ROUTE_TABLE_MAP[match[1]];
      singleId = match[2];
    }
  }

  if (!routeConfig) return null;

  const params = new URLSearchParams(queryString || '');
  const restParams = new URLSearchParams();

  // Convert query params to PostgREST eq. syntax
  for (const [key, value] of params.entries()) {
    if (key === 'page' || key === 'limit') continue;
    if (key === 'search') {
      restParams.set('name', `ilike.*${value}*`);
    } else if (key === 'active') {
      restParams.set('is_active', `eq.${value}`);
    } else {
      restParams.set(toSnake(key), `eq.${value}`);
    }
  }

  if (singleId) {
    restParams.set('id', `eq.${singleId}`);
  }

  if (routeConfig.select) {
    restParams.set('select', routeConfig.select);
  }
  if (routeConfig.orderBy) {
    restParams.set('order', routeConfig.orderBy);
  }

  const page = parseInt(params.get('page') || '1');
  const limit = parseInt(params.get('limit') || '100');
  const offset = (page - 1) * limit;

  const url = `${SUPABASE_URL}/rest/v1/${routeConfig.table}?${restParams.toString()}`;

  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Range': `${offset}-${offset + limit - 1}`,
      'Prefer': 'count=exact',
    },
  });

  if (!res.ok) return null;

  const raw = await res.json();
  const data = camelizeKeys(raw) as Record<string, unknown>[];

  // Parse content-range for total count
  const contentRange = res.headers.get('content-range');
  const total = contentRange ? parseInt(contentRange.split('/')[1] || '0') : data.length;

  // Normalize submission_count from PostgREST aggregate [{count: N}] → _count: { submissions: N }
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === 'object') {
        const countSub = item['submissionCount'] as { count: number }[] | undefined;
        if (Array.isArray(countSub)) {
          item['_count'] = { submissions: countSub[0]?.count ?? 0 };
          delete item['submissionCount'];
        }
      }
    }
  }

  // Single resource: return { data: item }
  if (singleId) {
    return { data: Array.isArray(data) ? data[0] ?? null : data } as T;
  }

  // List: return { data, pagination }
  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  } as T;
}

// ── Main apiClient with fallback ──

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  // Try API server first (with 3s timeout to fail fast on GitHub Pages)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...config,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch {
    // API unavailable — fall back to Supabase REST for GET requests
    if (method === 'GET') {
      const fallback = await supabaseGet<T>(endpoint);
      if (fallback) return fallback;
    }
    throw new Error('Service unavailable');
  }
}
