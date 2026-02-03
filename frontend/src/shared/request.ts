// Универсальная функция для выполнения HTTP-запросов и обработки JSON-ответов в строгой типизации
export async function request<T = unknown>(input: string, init?: RequestInit): Promise<T | undefined> {
  const res = await fetch(input, init);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as T;
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  } catch (e) {
    throw new Error('Failed to parse JSON response');
  }
}
