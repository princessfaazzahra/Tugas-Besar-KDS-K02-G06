export async function callApi<T>(endpoint: string, data: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Pastikan app sudah berjalan.');
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json() as { error?: string };
      message = err.error || message;
    } catch {
      // response bukan JSON (mis. halaman error)
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}
