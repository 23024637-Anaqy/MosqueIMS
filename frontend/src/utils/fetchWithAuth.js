export default async function fetchWithAuth(url, options = {}) {
  const raw = localStorage.getItem('user')
  let token = null
  if (raw) {
    try {
      const user = JSON.parse(raw)
      token = user.token || user.id || user._id
    } catch (e) {
      localStorage.removeItem('user')
    }
  }

  const headers = new Headers(options.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type') && !(options && options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    // Clear stored user and notify app to logout
    localStorage.removeItem('user')
    try {
      window.dispatchEvent(new CustomEvent('app-logout'))
    } catch (e) {
      // ignore
    }
  }

  return res
}
