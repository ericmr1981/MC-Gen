export function getApiBasePath(): string {
  // When served behind Home Portal at /nexus/, API is exposed at /nexus/api/*
  // In local dev or direct access, backend serves API at /api/*
  const p = window.location.pathname || '/';
  return p.startsWith('/nexus') ? '/nexus/api' : '/api';
}

export function apiUrl(path: string): string {
  const base = getApiBasePath();
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`;
}
