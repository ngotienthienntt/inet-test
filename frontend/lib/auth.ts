export const TOKEN_KEY = 'shopvn_token'
export const SESSION_KEY = 'shopvn_session'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // localStorage unavailable
  }
}

export function removeToken(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // localStorage unavailable
  }
}

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function setSessionToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SESSION_KEY, token)
  } catch {
    // localStorage unavailable
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}
