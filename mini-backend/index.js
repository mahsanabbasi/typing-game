const express = require('express')
const cors = require('cors')
const Database = require('better-sqlite3')

const app = express()
app.use(cors())
app.use(express.json())

const ADMIN_KEY = process.env.ADMIN_KEY || 'change-me' // isay badal lena
const ID_PATTERN = /^\d{2}[A-Z]-\d{4}$/

const db = new Database('spell-duel.db')
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    user_id     TEXT PRIMARY KEY,
    status      TEXT NOT NULL DEFAULT 'playing',
    started_at  INTEGER NOT NULL,
    finished_at INTEGER,
    words       INTEGER,
    wpm         INTEGER,
    cpm         INTEGER,
    errors      INTEGER,
    accuracy    INTEGER
  )
`)

const cleanId = (v) => String(v || '').trim().toUpperCase()

// ranking: words > cpm > accuracy > kam errors > pehle finish
const rankedQuery = db.prepare(`
  SELECT user_id AS userId, words, wpm, cpm, errors, accuracy, finished_at AS finishedAt
  FROM players
  WHERE status = 'finished'
  ORDER BY words DESC, cpm DESC, accuracy DESC, errors ASC, finished_at ASC
`)
const getLeaderboard = () => rankedQuery.all().map((row, i) => ({ rank: i + 1, ...row }))

// ---- live updates (SSE) ----
const clients = new Set()
function broadcast() {
  const data = `data: ${JSON.stringify(getLeaderboard())}\n\n`
  for (const res of clients) res.write(data)
}
setInterval(() => {
  for (const res of clients) res.write(': ping\n\n') // connection zinda rakhne ke liye
}, 25000)

app.get('/api/leaderboard/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.flushHeaders()
  res.write(`data: ${JSON.stringify(getLeaderboard())}\n\n`)
  clients.add(res)
  req.on('close', () => clients.delete(res))
})

app.get('/api/leaderboard', (req, res) => res.json(getLeaderboard()))

// ---- game start: ek ID, ek attempt ----
app.post('/api/start', (req, res) => {
  const userId = cleanId(req.body.userId)
  if (!ID_PATTERN.test(userId)) return res.status(400).json({ error: 'ID ka format galat hai' })
  try {
    db.prepare('INSERT INTO players (user_id, started_at) VALUES (?, ?)').run(userId, Date.now())
    res.json({ ok: true })
  } catch (e) {
    if (String(e.code).startsWith('SQLITE_CONSTRAINT')) {
      return res.status(409).json({ error: 'Is ID se game pehle hi khela ja chuka hai' })
    }
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

// ---- game finish: stats save ----
app.post('/api/finish', (req, res) => {
  const userId = cleanId(req.body.userId)
  const { words, wpm, cpm, errors, accuracy } = req.body

  if (![words, wpm, cpm, errors, accuracy].every(Number.isFinite)) {
    return res.status(400).json({ error: 'Stats galat hain' })
  }
  if (words < 0 || errors < 0 || cpm < 0 || cpm > 1500 || accuracy < 0 || accuracy > 100) {
    return res.status(400).json({ error: 'Stats realistic nahi hain' })
  }

  const row = db.prepare('SELECT status, started_at FROM players WHERE user_id = ?').get(userId)
  if (!row) return res.status(404).json({ error: 'Pehle game start karo' })
  if (row.status === 'finished') return res.status(409).json({ error: 'Score pehle hi save ho chuka hai' })
  if (Date.now() - row.started_at < 55000) {
    return res.status(400).json({ error: 'Game itni jaldi khatam nahi ho sakta' })
  }

  db.prepare(`
    UPDATE players
    SET status = 'finished', finished_at = ?, words = ?, wpm = ?, cpm = ?, errors = ?, accuracy = ?
    WHERE user_id = ?
  `).run(Date.now(), words, wpm, cpm, errors, accuracy, userId)

  broadcast()
  const rank = getLeaderboard().find((r) => r.userId === userId)?.rank
  res.json({ ok: true, rank })
})

// ---- organizer reset (crash/refresh ki surat mein) ----
app.delete('/api/admin/players/:userId', (req, res) => {
  if (req.get('x-admin-key') !== ADMIN_KEY) return res.status(401).json({ error: 'Ijazat nahi' })
  const info = db.prepare('DELETE FROM players WHERE user_id = ?').run(cleanId(req.params.userId))
  broadcast()
  res.json({ deleted: info.changes })
})

app.listen(5000, () => console.log('Server http://localhost:5000 par chal raha hai'))