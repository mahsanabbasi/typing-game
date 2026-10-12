export const API = 'http://localhost:5000'

async function post(path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || 'Server error'), { status: res.status })
  return data
}

export const startGame = (userId) => post('/api/start', { userId })

export const finishGame = (userId, s) =>
  post('/api/finish', {
    userId,
    words: s.score,
    wpm: s.wpm,
    cpm: s.cpm,
    errors: s.errors,
    accuracy: s.accuracy,
  })