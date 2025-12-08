"use client"

import { useEffect,  useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PomodoroTimer from "./pomodoro-timer"
import FocusStats from "./focus-stats"
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
import FlowTimer from "./flow-timer"
import MiniTimer from "./mini-timer"
import ShuffleTimer from "./Shuffle-timer"
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

export default function FocusSessionsView() {
  const [timerMode, setTimerMode] = useState<"pomodoro" | "flow" | "mini" | "shuffle" >("pomodoro")
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

  const API_BASE = "http://localhost:8000/api/focus-sessions/";

  const authHeaders = () => {
    const token = localStorage.getItem("accessToken"); // your JWT storage
    return { headers: { Authorization: `Bearer ${token}` } };
  };


  /* ---------- Load History ---------- */
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await axios.get<SessionHistory[]>(`${API_BASE}`, authHeaders());
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
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Focus Sessions</h1>
        <p className="text-muted-foreground mt-1">Stay focused with guided focus sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer */}
        <div className="lg:col-span-2">
          <Tabs value={timerMode} onValueChange={(v) => setTimerMode(v as "pomodoro" | "flow" | "mini" | "shuffle")}>
            <TabsList>
              <TabsTrigger value="pomodoro">Pomodoro (25 min)</TabsTrigger>
              <TabsTrigger value="flow">Flow</TabsTrigger>
              <TabsTrigger value="mini">Mini</TabsTrigger>
              <TabsTrigger value="shuffle">Shuffle</TabsTrigger>

            </TabsList>

            <TabsContent value="pomodoro">
              <PomodoroTimer />
            </TabsContent>
         <TabsContent value="flow">
              <FlowTimer />
            </TabsContent>
                     <TabsContent value="mini">
              <MiniTimer />
            </TabsContent>
        <TabsContent value="shuffle">
              <ShuffleTimer />
            </TabsContent>
         
          </Tabs>
        </div>

        {/* Stats */}
        <div>
          <FocusStats />
        </div>
      </div>
    </div>
  )
}
