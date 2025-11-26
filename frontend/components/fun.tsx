"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Define the type for notes 👇
interface StickyNote {
  text: string;
  top: number;
  left: number;
  rotate: number;
  color: string;
}

export default function Fun() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [chaosMode, setChaosMode] = useState(true);

  useEffect(() => {
    const baseNotes = [
      "💡 Idea overflow!",
      "🧠 Focus?? What's that?",
      "☕ Coffee = productivity",
      "💭 Oh look, a new project!",
      "📅 I’ll do it later (probably)",
      "🔥 Hyperfocus mode on!",
      "🎵 Need background noise to think",
      "📚 Starting 5 books at once",
      "✨ Maybe I should redecorate instead",
    ];

    const randomColor = () => {
      const colors = [
        "bg-pink-200",
        "bg-yellow-200",
        "bg-green-200",
        "bg-blue-200",
        "bg-purple-200",
        "bg-orange-200",
        "bg-rose-200",
        "bg-cyan-200",
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    const randomNotes: StickyNote[] = baseNotes.map((text) => ({
      text,
      top: Math.random() * 80 + 5,
      left: Math.random() * 80 + 5,
      rotate: Math.random() * 10 - 5,
      color: randomColor(),
    }));

    setNotes(randomNotes);
  }, []);

  return (
    <div
      className={`min-h-screen w-full relative overflow-hidden transition-all duration-700 ${
        chaosMode
          ? "bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
          : "bg-gradient-to-br from-blue-100 via-teal-100 to-green-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"
      }`}
    >
      {/* 🌈 Floating blobs */}
      {chaosMode && (
        <>
          <motion.div
            className="absolute w-56 h-56 bg-pink-300/30 blur-3xl rounded-full top-10 left-1/4"
            animate={{ y: [0, -40, 0], x: [0, 20, 0] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-72 h-72 bg-blue-300/30 blur-3xl rounded-full bottom-20 right-1/3"
            animate={{ y: [0, 40, 0], x: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-48 h-48 bg-purple-300/40 blur-2xl rounded-full top-1/3 left-10"
            animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
          />
        </>
      )}

      {/* 💭 Sticky notes */}
      {chaosMode &&
        notes.map((note, index) => (
          <motion.div
            key={index}
            className={`${note.color} absolute p-4 rounded-lg shadow-xl text-gray-800 dark:text-gray-900 font-semibold cursor-grab active:cursor-grabbing`}
            style={{
              top: `${note.top}%`,
              left: `${note.left}%`,
              rotate: `${note.rotate}deg`,
            }}
            drag
            dragConstraints={{ top: 0, bottom: 1000, left: 0, right: 1000 }}
            whileHover={{ scale: 1.1, rotate: note.rotate + 3 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              y: [0, Math.random() * 20 - 10, 0],
              rotate: [note.rotate, note.rotate + 2, note.rotate - 2, note.rotate],
            }}
            transition={{
              repeat: Infinity,
              duration: Math.random() * 6 + 6,
              ease: "easeInOut",
            }}
          >
            {note.text}
          </motion.div>
        ))}

      {/* 🧠 Main Title */}
      <motion.h1
        className={`absolute text-5xl md:text-6xl font-bold text-center w-full top-10 ${
          chaosMode
            ? "text-purple-700 dark:text-purple-300"
            : "text-green-700 dark:text-green-300"
        } drop-shadow-lg`}
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
      >
        {chaosMode ? "🧠 ADHD Chaos Universe" : "🌿 Focus Sanctuary"}
      </motion.h1>

      {/* 🌗 Toggle Button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setChaosMode(!chaosMode)}
          className={`px-5 py-3 rounded-xl font-semibold shadow-md transition-all duration-500 ${
            chaosMode
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {chaosMode ? "☁️ Calm Down (Focus Mode)" : "⚡ Go Chaos Mode"}
        </button>
      </div>

      {/* 🌼 Center Focus Message */}
      {!chaosMode && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-4xl font-bold text-green-800 dark:text-green-200 mb-4">
            🌸 Breathe. You’re in Focus Mode.
          </h2>
          <p className="text-lg text-green-700 dark:text-green-300">
            Stay calm, one task at a time — your world will still be there later 🌍
          </p>
        </motion.div>
      )}
    </div>
  );
}
