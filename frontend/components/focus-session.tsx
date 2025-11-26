"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  Rabbit,
  Sparkles,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import axios from "axios";

type FocusMode = "pomodoro" | "flow" | "mini" | "shuffle";

interface SessionHistory {
  date: string;
  mode: FocusMode;
  duration: number;
  completed: boolean;
}

const FLOW_MAX_HOURS_PER_DAY = 3;
const FLOW_MAX_SESSIONS_PER_DAY = 2;

const BUNNY_QUOTES = {
  mini: "Let’s just hop for 5 minutes — no pressure!",
  flow: "Ride the wave — I’ll track your time while you stay in the zone!",
  shuffle: "Time to juggle! I’ll shuffle your tasks.",
  pomodoro: "25 minutes of pure focus. You got this!",
};

export default function FocusSession() {
  const [mode, setMode] = useState<FocusMode>("pomodoro");
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [shuffledTasks, setShuffledTasks] = useState<string[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [flowSessionCount, setFlowSessionCount] = useState(0);
  const [flowMinutesToday, setFlowMinutesToday] = useState(0);
  const [showBunny, setShowBunny] = useState(true);
  const [history, setHistory] = useState<SessionHistory[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const API_BASE = "http://localhost:8000/api/focus/";

  const authHeaders = () => {
    const token = localStorage.getItem("accessToken"); // your JWT storage
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  /* ---------- Load History ---------- */
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await axios.get<SessionHistory[]>(`${API_BASE}sessions/`, authHeaders());
        if (!res.data || !Array.isArray(res.data)) return;
        setHistory(res.data);
        updateDailyFlowStats(res.data);
      } catch (err) {
        console.error("Error loading sessions:", err);
      }
    };

    loadHistory();
  }, []);

  /* ---------- Save Session ---------- */
  const saveSession = async (session: SessionHistory) => {
    try {
      await axios.post(`${API_BASE}start/`, { mode: session.mode, task_ids: [] }, authHeaders());
      const updated = [...history, session];
      setHistory(updated);
      updateDailyFlowStats(updated);
    } catch (err) {
      console.error("Error saving session:", err);
    }
  };

  /* ---------- Flow Stats ---------- */
  const updateDailyFlowStats = (hist: SessionHistory[]) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayFlow = hist.filter((s) => s.date.startsWith(today) && s.mode === "flow");
    setFlowSessionCount(todayFlow.length);
    setFlowMinutesToday(todayFlow.reduce((sum, s) => sum + s.duration, 0));
  };

  /* ---------- Timer Logic ---------- */
  useEffect(() => {
    if (!isRunning) return;

    if (mode === "flow") {
      intervalRef.current = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    } else {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  /* ---------- Handlers ---------- */
  const startSession = () => {
    if (mode === "flow" && flowSessionCount >= FLOW_MAX_SESSIONS_PER_DAY) {
      alert("You reached the Flow limit for today.");
      return;
    }
    if (mode === "flow" && flowMinutesToday / 60 >= FLOW_MAX_HOURS_PER_DAY) {
      alert("You reached the daily Flow hours limit.");
      return;
    }
    if (mode === "shuffle" && selectedTasks.length < 3) {
      alert("Please select 3 tasks for Shuffle.");
      return;
    }

    startTimeRef.current = Date.now();
    setIsRunning(true);
    setShowBunny(true);

    if (mode === "shuffle") {
      const shuffled = [...selectedTasks].sort(() => Math.random() - 0.5);
      setShuffledTasks(shuffled);
      setCurrentTaskIndex(0);
    }
  };

  const pauseSession = () => setIsRunning(false);

  const resetSession = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setTimeLeft(getDefaultDuration(mode));
    setCurrentTaskIndex(0);
  };

  const getDefaultDuration = (m: FocusMode) => {
    switch (m) {
      case "pomodoro":
        return 25 * 60;
      case "mini":
        return 5 * 60;
      case "flow":
        return 0;
      case "shuffle":
        return 15 * 60;
    }
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);

    const duration =
      mode === "flow"
        ? Math.floor(elapsedTime / 60)
        : Math.floor((Date.now() - startTimeRef.current) / 60000);

    const newSession: SessionHistory = {
      date: new Date().toISOString(),
      mode,
      duration,
      completed: true,
    };

    await saveSession(newSession);

    if (mode === "shuffle") {
      alert("Task Shuffle Completed!");
    }
  };

  /* ---------- Timer Values ---------- */
  const minutes = mode === "flow" ? Math.floor(elapsedTime / 60) : Math.floor(timeLeft / 60);
  const seconds = mode === "flow" ? Math.floor(elapsedTime % 60) : Math.floor(timeLeft % 60);

  /* ---------- Adaptive Suggestion ---------- */
  const getAdaptiveSuggestion = () => {
    const pomodoros = history.filter((h) => h.mode === "pomodoro");
    const minis = history.filter((h) => h.mode === "mini");
    const flows = history.filter((h) => h.mode === "flow");

    if (pomodoros.length > 5) {
      const avg = pomodoros.reduce((s, h) => s + h.duration, 0) / pomodoros.length;
      if (avg > 20) return "You crush Pomodoros! Want another?";
    }
    if (minis.length > 3) return "Mini sessions are your strength!";
    if (flows.length > 2) return "You’re a Flow master!";
    return null;
  };

  /* ---------- Helper: Streak Calculator ---------- */
  const calculateStreak = (history: SessionHistory[]) => {
    if (history.length === 0) return 0;

    const dates = [...new Set(history.map((h) => h.date.split("T")[0]))].sort().reverse();

    let streak = 0;
    let current = format(new Date(), "yyyy-MM-dd");

    for (const date of dates) {
      if (date === current) {
        streak++;
        current = format(new Date(Date.parse(current) - 86400000), "yyyy-MM-dd");
      } else break;
    }

    return streak;
  };

  /* ---------- UI ---------- */
  return (
    <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur border-secondary/10">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Focus Session</span>

          {/* Mode Switch */}
          <div className="flex gap-1">
            {["pomodoro", "flow", "mini", "shuffle"].map((m) => (
              <Button
                key={m}
                size="sm"
                variant={mode === m ? "default" : "outline"}
                onClick={() => {
                  setMode(m as FocusMode)
                  resetSession()
                  setTimeLeft(getDefaultDuration(m as FocusMode))
                }}
                className="capitalize"
              >
                {m}
              </Button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Bunny Message */}
        {showBunny && (
          <div className="flex items-center gap-2 text-sm animate-pulse">
            <Rabbit className="w-5 h-5" />
            <span>{BUNNY_QUOTES[mode]}</span>
          </div>
        )}

        {/* Timer */}
        <div className="text-center">
          <div className="text-7xl font-bold text-primary mb-2">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>

          {mode === "shuffle" && shuffledTasks.length > 0 && (
            <p className="text-lg font-medium">
              {currentTaskIndex + 1}/{shuffledTasks.length}:{" "}
              {shuffledTasks[currentTaskIndex]}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={isRunning ? pauseSession : startSession}
            size="lg"
            disabled={mode === "shuffle" && selectedTasks.length < 3}
          >
            {isRunning ? (
              <Pause className="w-5 h-5 mr-2" />
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            {isRunning ? "Pause" : "Start"}
          </Button>

          <Button onClick={resetSession} variant="outline" size="lg">
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>

        {/* Flow Info */}
        {mode === "flow" && (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <AlertCircle className="w-4 h-4" />
            <span>
              {flowSessionCount}/{FLOW_MAX_SESSIONS_PER_DAY} sessions •{" "}
              {flowMinutesToday} min today
            </span>
          </div>
        )}

        {/* Task Shuffle */}
        {mode === "shuffle" && !isRunning && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Select 3 tasks:</p>
            {[
              "Clean desk",
              "Reply email",
              "Drink water",
              "Stretch",
              "Call mom",
              "File docs",
            ].map((task) => (
              <label key={task} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedTasks.includes(task)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTasks((prev) => [...prev, task].slice(0, 3))
                    } else {
                      setSelectedTasks((prev) =>
                        prev.filter((t) => t !== task)
                      )
                    }
                  }}
                />
                <span className="text-sm">{task}</span>
              </label>
            ))}
          </div>
        )}

        {/* Suggestion */}
        {getAdaptiveSuggestion() && (
          <div className="p-3 bg-accent/10 rounded-lg text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>{getAdaptiveSuggestion()}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Daily Sessions</p>
            <p className="text-2xl font-bold">
              {
                history.filter((h) =>
                  h.date.startsWith(format(new Date(), "yyyy-MM-dd"))
                ).length
              }
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Minutes</p>
            <p className="text-2xl font-bold">
              {history.reduce((s, h) => s + h.duration, 0)}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Streak</p>
            <p className="text-2xl font-bold">{calculateStreak(history)} days</p>
          </div>
        </div>

        {/* Badges */}
        {history.filter((h) => h.mode === "shuffle").length >= 1 && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full text-sm font-medium">
              <Trophy className="w-4 h-4 text-yellow-600" />
              Task Juggler
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ---------- Helper: Streak Calculator ---------- */
function calculateStreak(history: SessionHistory[]) {
  if (history.length === 0) return 0

  const dates = [...new Set(history.map((h) => h.date.split("T")[0]))]
    .sort()
    .reverse()

  let streak = 0
  const today = format(new Date(), "yyyy-MM-dd")
  let current = today

  for (const date of dates) {
    if (date === current) {
      streak++
      current = format(new Date(Date.parse(current) - 86400000), "yyyy-MM-dd")
    } else break
  }

  return streak
}
