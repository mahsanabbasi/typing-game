import { useState } from "react";
import Game from "./Game";
const ID_PATTERN = /^\d{2}[A-Z]-\d{4}$/i;
function getAttempts() {
  try {
    return JSON.parse(localStorage.getItem("attempts")) || [];
  } catch {
    return [];
  }
}

function saveAttempt(id) {
  localStorage.setItem("attempts", JSON.stringify([...getAttempts(), id]));
}

export default function App() {
  const [screen, setScreen] = useState("login"); // login | start | play | result
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function handleLogin() {
    const id = userId.trim().toUpperCase();
    if (!ID_PATTERN.test(id)) {
      setError("Enter correct Id");
      return;
    }
    if (getAttempts().includes(id)) {
      setError("This ID is used before");
      return;
    }
    setUserId(id);
    setError("");
    setScreen("start");
  }

  function startGame() {
    saveAttempt(userId); // attempt shuru hote hi count (refresh se bachne ke liye)
    setScreen("play");
  }

  function nextStudent() {
    setUserId("");
    setResult(null);
    setScreen("login");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="stars" />
      {screen === "login" && (
        <>
          <h1 className="text-5xl font-bold glow-text">Spell Typing Duel</h1>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Student ID (24K-0123)"
            className="px-4 py-2 rounded bg-castle text-parchment border border-gold"
          />
          {error && <p className="text-red-400">{error}</p>}
          <button onClick={handleLogin} className="gold-btn">
            Login
          </button>
        </>
      )}

      {screen === "start" && (
        <>
          <h1 className="text-3xl">Welcome, {userId}</h1>
          <p>60 seconds. Only One Chance. Good Luck.</p>
          <button onClick={startGame} className="gold-btn">
            Start
          </button>
        </>
      )}

      {screen === "play" && (
        <Game
          onFinish={(r) => {
            setResult(r);
            setScreen("result");
          }}
        />
      )}

      {screen === "result" && (
        <>
          <h1 className="text-3xl">Result: {userId}</h1>
          <p className="text-5xl font-bold text-amber-400">
            {result?.score} words
          </p>
          <div className="grid grid-cols-2 gap-3 text-center">
            <p>WPM: {result?.wpm}</p>
            <p>CPM: {result?.cpm}</p>
            <p>Errors: {result?.errors}</p>
            <p>Accuracy: {result?.accuracy}%</p>
          </div>
          <button onClick={nextStudent} className="gold-btn">
            Next student
          </button>
        </>
      )}
    </div>
  );
}
