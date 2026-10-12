import { useState, useEffect } from 'react'
import Game from './Game'
import Leaderboard from './Leaderboard'
import { startGame, finishGame } from './api'

const ID_PATTERN = /^\d{2}[A-Z]-\d{4}$/i

function GameFlow() {
  const [screen, setScreen] = useState('login') // login | start | play | result
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [saveState, setSaveState] = useState('idle') // sending | saved | error
  const [rank, setRank] = useState(null)

  function handleLogin() {
    const id = userId.trim().toUpperCase()
    if (!ID_PATTERN.test(id)) {
      setError('Sahi uni ID likho (jaise 24K-0123)')
      return
    }
    setUserId(id)
    setError('')
    setScreen('start')
  }

  async function handleStart() {
    setBusy(true)
    try {
      await startGame(userId)
      setError('')
      setScreen('play')
    } catch (err) {
      setError(err.status ? err.message : 'Server se connect nahi ho paya')
      setScreen('login')
    } finally {
      setBusy(false)
    }
  }

  async function submitResult(stats) {
    setSaveState('sending')
    try {
      const data = await finishGame(userId, stats)
      setRank(data.rank)
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  function handleFinish(stats) {
    setResult(stats)
    setScreen('result')
    submitResult(stats)
  }

  function nextStudent() {
    setUserId('')
    setResult(null)
    setRank(null)
    setSaveState('idle')
    setScreen('login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="stars" />

      {screen === 'login' && (
        <>
          <h1 className="text-5xl font-bold glow-text">Spell Typing Duel</h1>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Uni ID (24K-0123)"
            className="px-4 py-2 rounded bg-castle text-parchment border border-gold"
          />
          {error && <p className="text-red-400">{error}</p>}
          <button onClick={handleLogin} className="gold-btn">Login</button>
          <a href="#/leaderboard" target="_blank" rel="noreferrer" className="gold-btn">
            🏆 Leaderboard
          </a>
        </>
      )}

      {screen === 'start' && (
        <>
          <h1 className="text-3xl">Welcome, {userId}</h1>
          <p>60 seconds. Sirf ek mauka. Type karte hi timer shuru.</p>
          <button onClick={handleStart} disabled={busy} className="gold-btn">
            {busy ? 'Ruko...' : 'Start'}
          </button>
        </>
      )}

      {screen === 'play' && <Game onFinish={handleFinish} />}

      {screen === 'result' && (
        <>
          <h1 className="text-3xl">Result: {userId}</h1>
          <p className="text-5xl font-bold glow-text">{result?.score} words</p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <p>WPM: {result?.wpm}</p>
            <p>CPM: {result?.cpm}</p>
            <p>Errors: {result?.errors}</p>
            <p>Accuracy: {result?.accuracy}%</p>
          </div>

          {saveState === 'sending' && <p>Score save ho raha hai...</p>}
          {saveState === 'saved' && (
            <>
              <p className="text-green-400">Saved ✓ Abhi tumhari rank: #{rank}</p>
              <button onClick={nextStudent} className="gold-btn">Next student</button>
            </>
          )}
          {saveState === 'error' && (
            <>
              <p className="text-red-400">Score save nahi hua (server check karo)</p>
              <button onClick={() => submitResult(result)} className="gold-btn">Retry</button>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return hash === '#/leaderboard' ? <Leaderboard /> : <GameFlow />
}