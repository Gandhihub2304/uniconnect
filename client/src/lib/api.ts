export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('uniconnect_token');
}

async function request<T = any>(method: string, path: string, body?: any, isForm?: boolean): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    throw new Error((data && (data.message || data.error)) || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const apiGet = <T = any>(path: string) => request<T>('GET', path);
export const apiPost = <T = any>(path: string, body?: any) => request<T>('POST', path, body);
export const apiPut = <T = any>(path: string, body?: any) => request<T>('PUT', path, body);
export const apiPatch = <T = any>(path: string, body?: any) => request<T>('PATCH', path, body);
export const apiDelete = <T = any>(path: string) => request<T>('DELETE', path);
export const apiUpload = <T = any>(path: string, form: FormData) => request<T>('POST', path, form, true);
