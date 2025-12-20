export async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as unknown as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}
