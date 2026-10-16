import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API } from "./api";

const SHOW_TOP = 10; // projector par kitne dikhane hain
const MEDALS = ["🥇", "🥈", "🥉"];
const COLS = "grid-cols-[4rem_1fr_repeat(5,6rem)]";

// piche udte hue jadui tare
function FloatingSparkles() {
  const [items] = useState(() =>
    Array.from({ length: 30 }, () => ({
      left: Math.random() * 100,
      size: 10 + Math.random() * 16,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 8,
    })),
  );
  return (
    <>
      {items.map((s, i) => (
        <span
          key={i}
          className="float-sparkle"
          style={{
            left: `${s.left}%`,
            fontSize: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        >
          ✦
        </span>
      ))}
    </>
  );
}

// naye score par sparkles ka dhamaka
function Burst() {
  const [bits] = useState(() =>
    Array.from({ length: 16 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 110;
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size: 12 + Math.random() * 16,
      };
    }),
  );
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute text-gold"
          style={{ fontSize: b.size }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: b.x, y: b.y, opacity: 0, scale: 1.3, rotate: 180 }}
          transition={{ duration: 1.3, ease: "easeOut" }}
        >
          ✦
        </motion.span>
      ))}
    </div>
  );
}

function Row({ entry, fresh }) {
  const top = entry.rank <= 3;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className={`relative grid ${COLS} items-center gap-2 px-4 py-3 rounded-lg border text-lg ${
        top ? `rank-${entry.rank}` : "border-gold/30 bg-castle/80"
      } ${fresh ? "fresh-glow" : ""}`}
    >
      {fresh && <Burst />}
      <span className="text-2xl font-bold">
        {top ? MEDALS[entry.rank - 1] : `#${entry.rank}`}
      </span>
      <span className="text-left font-type font-bold tracking-wider">
        {entry.userId}
      </span>
      <span className="text-2xl font-bold glow-text">{entry.words}</span>
      <span>{entry.wpm}</span>
      <span>{entry.cpm}</span>
      <span>{entry.accuracy}%</span>
      <span>{entry.errors}</span>
    </motion.li>
  );
}

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [connected, setConnected] = useState(false);
  const [fresh, setFresh] = useState({});
  const known = useRef(null); // pehle se dikhne wale IDs

  useEffect(() => {
    const es = new EventSource(`${API}/api/leaderboard/stream`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      const list = JSON.parse(e.data);

      if (known.current) {
        const added = list
          .filter((x) => !known.current.has(x.userId))
          .map((x) => x.userId);
        if (added.length) {
          setFresh((f) => {
            const n = { ...f };
            added.forEach((id) => (n[id] = true));
            return n;
          });
          setTimeout(() => {
            setFresh((f) => {
              const n = { ...f };
              added.forEach((id) => delete n[id]);
              return n;
            });
          }, 6000);
        }
      }

      known.current = new Set(list.map((x) => x.userId));
      setEntries(list);
      setLoaded(true);
    };
    return () => es.close();
  }, []);

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center">
      <div className="stars" />
      <FloatingSparkles />

      <h1 className="text-5xl font-bold glow-text mb-1">Hall of Champions</h1>
      <p className="opacity-80 mb-2">Spell Typing Duel</p>
      <p className="mb-6 flex items-center gap-2">
        <span
          className={`inline-block w-3 h-3 rounded-full ${
            connected ? "bg-green-400 animate-pulse" : "bg-red-500"
          }`}
        />
        {connected ? "Live" : "Reconnecting..."} · {entries.length} players
      </p>

      <div
        className={`w-full max-w-5xl grid ${COLS} gap-2 px-4 pb-2 text-sm uppercase tracking-widest text-gold`}
      >
        <span>Rank</span>
        <span className="text-left">Player</span>
        <span>Words</span>
        <span>WPM</span>
        <span>CPM</span>
        <span>Acc</span>
        <span>Errors</span>
      </div>

      <ul className="w-full max-w-5xl flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {entries.slice(0, SHOW_TOP).map((e) => (
            <Row key={e.userId} entry={e} fresh={!!fresh[e.userId]} />
          ))}
        </AnimatePresence>
      </ul>

      {loaded && entries.length === 0 && (
        <p className="mt-10 text-xl opacity-80">No score yet... ✨</p>
      )}

      <a href="#/" className="mt-10 text-sm opacity-60 underline">
        Back to game
      </a>
    </div>
  );
}
