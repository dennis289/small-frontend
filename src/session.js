/**
 * Session storage and expiry — the single source of truth for "are we logged in".
 *
 * These three localStorage keys are read from several places that can't share Pinia
 * state (the router guard runs before the store is guaranteed hydrated, and the axios
 * interceptor lives outside the component tree), so the key names and the expiry
 * rules live here rather than being repeated.
 *
 * Access tokens last 15 minutes and refresh tokens 7 days, so a returning user
 * almost always arrives with a dead access token and a live refresh token. That case
 * is normal and must not log them out — only a dead *refresh* token ends the session.
 */

export const TOKEN_KEY = 'auth_token'
export const REFRESH_KEY = 'auth_refresh'
export const USER_KEY = 'user'

export function getToken () {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken () {
  return localStorage.getItem(REFRESH_KEY)
}

export function getStoredUser () {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    // A malformed value (e.g. the literal string "undefined") shouldn't crash the guard.
    return null
  }
}

export function setTokens (access, refresh) {
  if (access) {
    localStorage.setItem(TOKEN_KEY, access)
  }
  // Refresh tokens rotate on every use; the old one is blacklisted immediately, so
  // a rotated token must replace the stored one or the next refresh will fail.
  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh)
  }
}

export function clearSession () {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

// ── Roles ────────────────────────────────────────────────────────────────────
// Mirrors User.ROLE_* on the backend. These gate what the UI *offers*; the real
// enforcement is the permission class on each endpoint. Never treat a check here
// as security — treat it as not showing people buttons that would 403.

export const ROLE_ADMIN = 'admin'
export const ROLE_SCHEDULER = 'scheduler'
export const ROLE_MEMBER = 'member'

/** The current user's tenant role, or null for platform admins / logged out. */
export function getRole () {
  const user = getStoredUser()
  return user?.is_platform_admin ? null : (user?.role ?? null)
}

export function isPlatformAdmin () {
  return !!getStoredUser()?.is_platform_admin
}

export function isClientAdmin () {
  return getRole() === ROLE_ADMIN
}

/** Admins and schedulers — the roles that run the rostering workflow. */
export function canSchedule () {
  return [ROLE_ADMIN, ROLE_SCHEDULER].includes(getRole())
}

/**
 * Where this user belongs by default: the first thing they can actually use.
 * Platform admins own no tenant data, schedulers can't reach the setup pages,
 * and members can only read the published schedule.
 */
export function homeRoute () {
  if (isPlatformAdmin()) {
    return '/admin/clients'
  }
  switch (getRole()) {
    case ROLE_ADMIN: {
      return '/home'
    }
    case ROLE_SCHEDULER: {
      return '/rosters'
    }
    default: {
      return '/schedule'
    }
  }
}

/** Decode a JWT payload without verifying it — we only need `exp`. */
export function decodeJwt (token) {
  if (!token) {
    return null
  }
  try {
    const payload = token.split('.', 3)[1]
    if (!payload) {
      return null
    }
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      [...atob(base64)]
        .map(c => '%' + c.codePointAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * True when the token is missing, unreadable, or past its `exp`.
 * `skewSeconds` treats a token as expired slightly early, so we don't fire off a
 * request with a token that dies in flight.
 */
export function isExpired (token, skewSeconds = 5) {
  const payload = decodeJwt(token)
  if (!payload?.exp) {
    return true
  }
  return Date.now() / 1000 >= payload.exp - skewSeconds
}

/**
 * Whether we still have a usable session. An expired access token is fine — the
 * interceptor will refresh it. An expired refresh token is not recoverable.
 */
export function hasLiveSession () {
  return !!getToken() && !isExpired(getRefreshToken())
}

/**
 * End the session and send the user to the login page.
 *
 * Uses a full page load rather than a router push so that in-memory state (stores,
 * cached lists from the previous account) can't survive into the next login. Guards
 * against redirect loops when we're already on /login, and preserves where the user
 * was so login can send them back.
 */
export function endSession ({ returnTo } = {}) {
  clearSession()

  const target = returnTo ?? window.location.pathname + window.location.search
  if (window.location.pathname === '/login') {
    return
  }

  const url = target && target !== '/'
    ? `/login?redirect=${encodeURIComponent(target)}`
    : '/login'
  window.location.replace(url)
}
