// app/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Zap, Star, AlertCircle, Bell, Rabbit, Target, Trophy } from "lucide-react"
import { format, isToday, parseISO } from "date-fns"
import AuthService from "@/services/authService"
import NotificationBell from "./Notification"
import { AnimatePresence, motion } from "framer-motion"
import confetti from "canvas-confetti"
import { RewardUnlockedModal } from "../reward/rewardunlocked"
// Types
interface Task {
  id: string
  title: string
  description?: string
  priority: "low" | "medium" | "high" | "urgent"
  due_date?: string
  completed: boolean
}

interface ShoppingItem {
  id: string;
  name: string;
  estimated_cost?: number;
  expiry_date?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  note?: string;
  item_type: "needed" | "impulsive";
  purchased: boolean;
}

interface Expense {
  id: string;
  amount: number;
  // add more fields if available
}

interface UserStats {
  level: number;
  xp: number;
  coins: number;
  achievements_count: number;
  salary_amount?: number;
}

interface Hobby {
  id: string
  name: string
  description?: string
}


interface Recommendation {
  message: string
  treat_yourself: ShoppingItem[]
  relax_with: Hobby[]
}
interface Notification {
  id: number
  type: string
  title: string
  message: string
  created_at: string
  is_read: boolean
}
export default function UltimateDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [expiringItems, setExpiringItems] = useState<ShoppingItem[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [loading, setLoading] = useState(true)
  const [prevLevel, setPrevLevel] = useState<number | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [levelUpStats, setLevelUpStats] = useState<{ newLevel: number; xpGained: number } | null>(null)
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [rewardModalData, setRewardModalData] = useState<{
    name: string
    description?: string
  } | null>(null)
  const token = AuthService.getAccessToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

const fetchData = async () => {
  if (!token) return;
  setLoading(true);

  try {
    const [tasksRes, expiringRes, profileRes, shoppingRes, expensesRes] = await Promise.all([
      fetch(`${API_URL}/tasks/`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/expiring-items/`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/profile/`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/shopping-items/`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/expenses/`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const tasksData: Task[] = tasksRes.ok ? await tasksRes.json() : [];
    const expiringData: ShoppingItem[] = expiringRes.ok ? await expiringRes.json() : [];
    const profile = profileRes.ok ? await profileRes.json() : {};
    const shoppingData: ShoppingItem[] = shoppingRes.ok ? await shoppingRes.json() : [];
    const expensesData: Expense[] = expensesRes.ok ? await expensesRes.json() : [];

    setTasks(tasksData);
    setExpiringItems(expiringData);

    const newStats: UserStats = {
      level: profile.level ?? 1,
      xp: profile.xp ?? 0,
      coins: profile.coins ?? 0,
      achievements_count: profile.achievements_count ?? 0,
      salary_amount: profile.salary_amount, // Only if backend sends it — no fallback!
    };

    // Level up logic (unchanged)
    if (prevLevel !== null && newStats.level > prevLevel) {
      setShowLevelUp(true);
      setLevelUpStats({
        newLevel: newStats.level,
        xpGained: newStats.xp - prevLevel * 1000,
      });
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.3 },
        colors: ["#fbbf24", "#60a5fa", "#34d399"],
      });
      setTimeout(() => setShowLevelUp(false), 3000);
    }

    setStats(newStats);
    setPrevLevel(newStats.level);

    // === SMART REWARD RECOMMENDATION (only if 500+ coins) ===
    if ((profile.coins ?? 0) >= 500) {
      let hobbies: Hobby[] = [];
      let baseMessage = "You've reached a reward milestone! Time to relax.";

      // Always try to get hobbies from backend
      const recRes = await fetch(`${API_URL}/reward-recommendations/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (recRes.ok) {
        const recData = await recRes.json();
        hobbies = recData.relax_with ?? [];
        if (recData.message) baseMessage = recData.message;
      }

      let finalMessage = baseMessage;
      let treatYourself: ShoppingItem[] = [];
      let relaxWith: Hobby[] = hobbies.length > 0 ? [hobbies[0]] : []; // Default: 1 hobby

      // Only attempt budget logic if salary is provided
      if (newStats.salary_amount != null) {
        const salary = newStats.salary_amount;
        const totalSpent = expensesData.reduce((acc, exp: any) => acc + Number(exp.amount || 0), 0);

        const neededUnpurchased = shoppingData.filter(
          (item): item is ShoppingItem & { estimated_cost: number } =>
            item.item_type === "needed" &&
            !item.purchased &&
            item.estimated_cost != null
        );
        const sumNeeded = neededUnpurchased.reduce((acc, item) => acc + item.estimated_cost, 0);

        // Reserve 30% for safety (emergencies + buffer)
        const reserve = salary * 0.3;
        const remainingAfterEssentials = salary - totalSpent - sumNeeded - reserve;
        const remainingForFun = Math.max(0, remainingAfterEssentials);

        // Find impulsive items user can actually afford
        const affordableImpulsive = shoppingData
          .filter(
            (item): item is ShoppingItem & { estimated_cost: number } =>
              item.item_type === "impulsive" &&
              !item.purchased &&
              item.estimated_cost != null &&
              item.estimated_cost <= remainingForFun
          )
          .sort((a, b) => {
            const order = { urgent: 4, high: 3, medium: 2, low: 1 };
            return (order[b.priority as keyof typeof order] ?? 0) - (order[a.priority as keyof typeof order] ?? 0);
          })
          .slice(0, 3);

        // Only suggest treat if truly safe and meaningful
        if (affordableImpulsive.length > 0 && remainingForFun >= 50) {
          treatYourself = affordableImpulsive;
          relaxWith = hobbies.slice(0, 2); // Can show up to 2 hobbies alongside treat
          finalMessage = `Great job! You have ~${Math.round(remainingForFun)} DT left after needs and safety reserve. A small treat is okay! 🎉`;
        } else {
          // Not enough → stick to hobby only
          finalMessage = `Stay strong! Focus on your needs first. Relax with a hobby — you deserve it. 💚`;
        }
      } else {
        // No salary info → safe default: only hobby
        finalMessage = `You've earned a reward! Take a break and enjoy a hobby. 🐾`;
      }

      const smartRecommendation: Recommendation = {
        message: finalMessage,
        treat_yourself: treatYourself,
        relax_with: relaxWith,
      };

      setRecommendation(smartRecommendation);
      setRewardModalData({
        name: "Bunny's Smart Reward",
        description: finalMessage,
      });
      setShowRewardModal(true);
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData()
  }, [token])
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API_URL}/ping/`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {})
    }, 60000) // every minute

    return () => clearInterval(interval)
  }, [token])
  // Derived values
  const urgentTasks = tasks.filter(
    (t) =>
      !t.completed &&
      (t.priority === "urgent" || t.priority === "high" || (t.due_date && isToday(parseISO(t.due_date)))),
  )

  const xpProgress = stats ? (stats.xp % 1000) / 10 : 0

  const nextLevelXP = (stats?.level ?? 1) * 1000

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
        {/* Bunny */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 1.6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="p-5 rounded-full bg-accent/10"
        >
          <Rabbit className="w-10 h-10 text-accent" />
        </motion.div>

        {/* Text */}
        <div className="space-y-1">
          <p className="text-lg font-medium text-foreground">Getting things ready…</p>
          <p className="text-sm text-muted-foreground">Just a tiny moment 🐾</p>
        </div>

        {/* Soft dots */}
        <motion.div
          className="flex gap-2 mt-2"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.2,
                repeat: Number.POSITIVE_INFINITY,
              },
            },
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-accent/60"
              variants={{
                hidden: { opacity: 0.3 },
                visible: { opacity: 1 },
              }}
            />
          ))}
        </motion.div>
      </div>
    )
  }

return (
    <div className="min-h-screen bg-background p-6 md:p-10 space-y-10 font-sans">


      {/* ===================== LEVEL UP CELEBRATION ===================== */}
      <AnimatePresence>
        {showLevelUp && levelUpStats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -100 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 rounded-2xl px-8 py-6 shadow-2xl">
              <motion.div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="mb-3 flex justify-center"
                >
                  <Trophy className="w-10 h-10 text-white drop-shadow-lg" />
                </motion.div>
                <p className="text-2xl font-bold text-white drop-shadow mb-1">Level {levelUpStats.newLevel}!</p>
                <p className="text-sm text-white/90 drop-shadow">You've leveled up! Keep crushing it! 🚀</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== HEADER ===================== */}
      <header className="space-y-3">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-bold tracking-tight text-foreground"
        >
          Dashboard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-muted-foreground text-lg"
        >
          Focus on one thing at a time. Progress will follow.
        </motion.p>
      </header>

      {/* ===================== LEVEL HUD ===================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-8 space-y-5">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground">Level {stats?.level}</p>
                <motion.p
                  key={stats?.xp}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-3xl font-bold text-foreground"
                >
                  {stats?.xp} XP
                </motion.p>
              </div>
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}>
                <Zap className="w-8 h-8 text-accent" />
              </motion.div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">Progress</span>
                <motion.span
                  key={Math.floor(xpProgress)}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs text-muted-foreground font-medium"
                >
                  {Math.floor(xpProgress)}%
                </motion.span>
              </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

{/* ===================== TODAY FOCUS & REMINDERS (SIDE BY SIDE) ===================== */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* TASKS SECTION */}
  <AnimatePresence>
    {urgentTasks.length > 0 && (
      <motion.div className="h-full">
        <Card className="h-full border border-blue-200 dark:border-blue-900/40 shadow-sm rounded-xl overflow-hidden bg-blue-50/30 dark:bg-slate-800/30 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 px-5 pt-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Target className="w-5 h-5 text-blue-600" />
              Today's Tasks
            </CardTitle>
          </CardHeader>

          <CardContent className="px-5 pb-4">
            <div
              className={`space-y-2 smooth-scroll ${
                urgentTasks.length > 2
                  ? "max-h-[144px] overflow-y-auto pr-2 cute-scroll-blue"
                  : "max-h-[144px]"
              }`}
            >
              {urgentTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg bg-white dark:bg-slate-900/50 border hover:bg-blue-50/40 transition"
                >
                  <p className="text-sm font-medium">{task.title}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )}
  </AnimatePresence>

  {/* REMINDERS SECTION */}
  <AnimatePresence>
    {expiringItems.length > 0 && (
      <motion.div className="h-full">
        <Card className="h-full border border-amber-200 dark:border-amber-900/40 shadow-sm rounded-xl overflow-hidden bg-amber-50/30 dark:bg-slate-800/30 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3 px-5 pt-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Bell className="w-5 h-5 text-amber-600" />
              Shopping Reminders
            </CardTitle>
          </CardHeader>

          <CardContent className="px-5 pb-4">
            <div
              className={`space-y-2 smooth-scroll ${
                expiringItems.length > 2
                  ? "max-h-[144px] overflow-y-auto pr-2 cute-scroll-amber"
                  : "max-h-[144px]"
              }`}
            >
              {expiringItems.map(item => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-white dark:bg-slate-900/50 border hover:bg-amber-50/40 transition flex justify-between"
                >
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs font-semibold text-amber-600">
                    {item.estimated_cost} DT
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )}
  </AnimatePresence>
</div>


      {/* ===================== STATS GRID ===================== */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, staggerChildren: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-5"
      >
        {[
          { title: "XP", value: stats?.xp, icon: Zap, color: "blue" },
          { title: "Coins", value: stats?.coins, icon: Star, color: "amber" },
          { title: "Achievements", value: stats?.achievements_count, icon: Trophy, color: "purple" },
          { title: "Level", value: stats?.level, icon: Award, color: "emerald" },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
            whileHover={{ y: -4 }}
          >
            <StatCard title={stat.title} value={stat.value} icon={stat.icon} color={stat.color as any} />
          </motion.div>
        ))}
      </motion.section>

      {/* ===================== REWARD ===================== */}
        {/* Smart Recommendations */}
        {recommendation && (
          <Card className="bg-gradient-to-br from-accent/10 via-primary/5 to-secondary/10 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <Star className="w-6 h-6 text-yellow-500" />
                Bunny's Special Message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg text-muted-foreground font-medium">{recommendation.message}</p>

              {recommendation.treat_yourself.length > 0 && (
                <div>
                  <h3 className="font-semibold text-accent mb-3">Treat Yourself</h3>
                  <div className="space-y-3">
                    {recommendation.treat_yourself.map(item => (
                      <div key={item.id} className="p-4 rounded-lg bg-white/40 backdrop-blur border border-accent/20 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <Badge variant="secondary">{item.priority}</Badge>
                        </div>
                        <p className="font-bold text-accent">{item.estimated_cost} DT</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendation.relax_with.length > 0 && (
                <div>
                  <h3 className="font-semibold text-secondary mb-3">Or Relax With</h3>
                  <div className="space-y-3">
                    {recommendation.relax_with.map(hobby => (
                      <div key={hobby.id} className="p-4 rounded-lg bg-white/40 backdrop-blur border border-secondary/20">
                        <p className="font-medium">{hobby.name}</p>
                        {hobby.description && <p className="text-sm text-muted-foreground mt-1">{hobby.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
  )
}

/* ===================== SMALL COMPONENT ===================== */
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value?: number
  icon: any
  color: "blue" | "amber" | "purple" | "emerald"
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-slate-800/50 border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-300",
    amber:
      "bg-amber-50 dark:bg-slate-800/50 border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-300",
    purple:
      "bg-purple-50 dark:bg-slate-800/50 border-purple-100 dark:border-purple-900/40 text-purple-600 dark:text-purple-300",
    emerald:
      "bg-emerald-50 dark:bg-slate-800/50 border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-300",
  }

  const classes = colorClasses[color]

  return (
    <Card className={`${classes} border shadow-sm rounded-2xl hover:shadow-md transition-shadow`}>
      <CardContent className="p-6 space-y-4">
        <motion.div
          className="flex items-center gap-2"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <Icon className="w-5 h-5 opacity-70" />
          <span className="text-sm font-semibold opacity-80">{title}</span>
        </motion.div>
        <motion.p
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-bold"
        >
          {value}
        </motion.p>
      </CardContent>
    </Card>
  )
}
