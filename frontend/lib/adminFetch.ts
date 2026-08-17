// Shared fetch wrapper for admin pages: attaches the bearer token
// automatically, and on 401 (expired/invalid session) clears it and
// redirects to /admin/login — mirrors admin/layout.tsx's handleLogout.
export function getToken(): string {
  return typeof window !== 'undefined' ? localStorage.getItem('shopvn_token') || '' : ''
}

export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${getToken()}` },
  })

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('shopvn_token')
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.href = '/admin/login'
  }

  return res
}
