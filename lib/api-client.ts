export async function callApi<T>(endpoint: string, data: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Pastikan menggunakan "vercel dev" untuk test lokal.');
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json() as { error?: string };
      message = err.error || message;
    } catch {
      if (res.status === 404) {
        message = 'API endpoint tidak ditemukan. Jalankan "vercel dev" (bukan "npm run dev") untuk test Python API secara lokal.';
      }
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}
