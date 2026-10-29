/**
 * Polite fetching for the collectors: 10 s timeout, 3 retries with backoff on
 * network errors, 429 and 5xx, and at most four requests in flight.
 */
export const DESKTOP_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(url: string, init: RequestInit = {}, { timeoutMs = 10_000, retries = 3 } = {}) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await wait(500 * 2 ** (attempt - 1));
    try {
      const response = await fetch(url, {
        ...init,
        headers: { "User-Agent": DESKTOP_UA, ...init.headers },
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}`);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function fetchJson<T>(url: string, options?: { timeoutMs?: number }): Promise<T> {
  const response = await fetchWithRetry(url, { headers: { Accept: "application/json" } }, options);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return (await response.json()) as T;
}

/** `items.map(fn)` with at most `limit` running at once; failures become `null`. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]).catch(() => null);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
