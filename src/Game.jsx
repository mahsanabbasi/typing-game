import { useState, useEffect, useRef } from "react";
import { sentences } from "./sentences";

const DURATION = 60;
const PASSAGE = sentences.join(" "); // sab students ke liye same

// word tabhi sahi jab uske saare letters sahi position par type hue hon
function countCorrectWords(typed) {
  let count = 0;
  let pos = 0;
  for (const word of PASSAGE.split(" ")) {
    const end = pos + word.length;
    if (typed.length >= end && typed.slice(pos, end) === word) count++;
    pos = end + 1;
  }
  return count;
}
       
                              
                    
                                         

function calcStats(typed, keys, seconds) {
  let correctChars = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === PASSAGE[i]) correctChars++;
  }
  const minutes = seconds / 60;
  const cpm = Math.round(correctChars / minutes);
  const wpm = Math.round(cpm / 5); // 5 letters = 1 word (standard)
  const accuracy = keys.total
    ? Math.round(((keys.total - keys.errors) / keys.total) * 100)
    : 100;
  return {
    score: countCorrectWords(typed),
    wpm,
    cpm,
    errors: keys.errors,
    accuracy,
  };
}

function Stat({ label, value, highlight }) {
  return (
    <div
      className={`rounded-lg p-3 text-center border border-gold/50 ${highlight ? "bg-gold text-night" : "bg-castle"}`}
    >
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

export default function Game({ onFinish }) {
  const [typed, setTyped] = useState("");
  const [keys, setKeys] = useState({ total: 0, errors: 0 });
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const latest = useRef({ typed: "", keys: { total: 0, errors: 0 } });
  const currentRef = useRef(null);

  // timer: pehla letter type hote hi shuru
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [started]);

  // time khatam hone par final result
  useEffect(() => {
    if (timeLeft === 0) {
      const { typed, keys } = latest.current;
      onFinish(calcStats(typed, keys, DURATION));
    }
  }, [timeLeft]);

  // current letter hamesha nazar aaye
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest" });
  }, [typed]);

  function handleChange(e) {
    if (timeLeft === 0) return;
    const value = e.target.value;

    // 1) backspace / delete: pichla text ka hissa ho to allow
    if (value.length < typed.length) {
      if (typed.startsWith(value)) {
        setTyped(value);
        latest.current = { typed: value, keys };
      }
      return;
    }

    // 2) naya letter: sirf end par ek letter allowed (paste band)
    if (value.length !== typed.length + 1) return;
    if (!value.startsWith(typed)) return;
    if (value.length > PASSAGE.length) return;

    const i = value.length - 1;
    const wrong = value[i] !== PASSAGE[i];
    const newKeys = {
      total: keys.total + 1,
      errors: keys.errors + (wrong ? 1 : 0),
    };

    if (!started) setStarted(true);
    setTyped(value);
    setKeys(newKeys);
    latest.current = { typed: value, keys: newKeys };
  }

  // live stats (render mein calculate hote hain)
  const elapsed = Math.max(DURATION - timeLeft, 1);
  const live = calcStats(typed, keys, elapsed);

  return (
    <div className="w-full max-w-5xl px-4 flex flex-col gap-6">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <Stat label="Time" value={`${timeLeft}s`} highlight />
        <Stat label="Score (words)" value={live.score} highlight />
        <Stat label="WPM" value={live.wpm} />
        <Stat label="CPM" value={live.cpm} />
        <Stat label="Errors" value={live.errors} />
        <Stat label="Accuracy" value={`${live.accuracy}%`} />
      </div>

      <div className="h-48 overflow-y-auto text-2xl leading-relaxed font-type p-4 rounded parchment">
        {PASSAGE.split("").map((char, i) => {
          let style = "text-amber-900/100";
          if (i < typed.length) {
            style =
              typed[i] === char ? "text-green-800" : "text-red-700 bg-red-200";
          }
          if (i === typed.length) style += " border-b-2 border-amber-700";
          return (
            <span
              key={i}
              ref={i === typed.length ? currentRef : null}
              className={style}
            >
              {char}
            </span>
          );
        })}
      </div>

      <input
        autoFocus
        value={typed}
        onChange={handleChange}
        onPaste={(e) => e.preventDefault()}
        className="w-full px-4 py-2 rounded bg-castle text-parchment border border-gold font-type"
        placeholder="Start Typing..."
      />
    </div>
  );
}
