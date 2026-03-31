import { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Heart,
  Brain,
  Lightbulb,
  Trophy,
  BarChart2,
  Medal,
  Flame,
  Star,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserAchievements, getCurrentStreaks } from "@/lib/achievements";
import type { AchievementBadge, CurrentStreaksResponse } from "@/lib/achievements";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Heart, label: "Mood Test", path: "/mood-test" },
  { icon: BookOpen, label: "Journal", path: "/journal" },
  { icon: Brain, label: "Meditation", path: "/meditation" },
  { icon: Lightbulb, label: "Tips", path: "/tips" },
  { icon: Trophy, label: "Achievements", path: "/achievements" },
  { icon: BarChart2, label: "Analytics", path: "/analytics" },
];

function StreakCard({ label, icon, current, best }: { label: string; icon: string; current: number; best: number }) {
  return (
    <div className="glass-card p-5 rounded-xl flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
        <span className="text-xl">{icon}</span>
        {label}
      </div>
      <div className="flex items-end gap-3">
        <div>
          <div className="text-3xl font-bold gradient-text flex items-center gap-1">
            {current}
            {current >= 3 && <Flame className="w-5 h-5 text-orange-500" />}
          </div>
          <div className="text-xs text-muted-foreground">Current streak</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-lg font-semibold text-muted-foreground">{best}</div>
          <div className="text-xs text-muted-foreground">Best</div>
        </div>
      </div>
    </div>
  );
}

function BadgeCard({ badge }: { badge: AchievementBadge }) {
  return (
    <div
      className={`glass-card p-5 rounded-xl flex flex-col gap-3 border transition-all ${
        badge.unlocked
          ? "border-primary/40 bg-primary/5"
          : "border-border opacity-60 grayscale"
      }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl">{badge.icon}</span>
        {badge.unlocked && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
            Unlocked
          </span>
        )}
        {!badge.unlocked && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            Locked
          </span>
        )}
      </div>
      <div>
        <div className="font-semibold text-sm">{badge.title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{badge.description}</div>
      </div>
      <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
        <Star className="w-3 h-3" />
        {badge.points} pts
      </div>
      {badge.unlocked && badge.unlockedAt && (
        <div className="text-xs text-muted-foreground">
          {new Date(badge.unlockedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      )}
    </div>
  );
}

const AchievementsPage = () => {
  const location = useLocation();
  const nav = useNavigate();
  const { user, logout } = useAuth();

  const [achievements, setAchievements] = useState<AchievementBadge[]>([]);
  const [streaks, setStreaks] = useState<CurrentStreaksResponse | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const [achData, streakData] = await Promise.all([
        getUserAchievements(),
        getCurrentStreaks(),
      ]);
      setAchievements(achData.achievements);
      setTotalPoints(achData.totalPoints);
      setStreaks(streakData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load achievements";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-2 mb-8">
            <Brain className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold gradient-text">MindCare</span>
          </Link>
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg smooth-transition ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-lg flex items-center justify-between px-8">
          <h1 className="text-2xl font-bold">Achievements</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {user?.name} ({user?.email})
            </div>
            <button
              onClick={() => { logout(); nav("/login", { replace: true }); }}
              className="text-sm text-muted-foreground hover:text-foreground smooth-transition"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold mb-2">Your Achievements</h2>
              <p className="text-muted-foreground">
                Track your wellness journey and earn badges
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Points summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Total Points</span>
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-3xl font-bold gradient-text">
                  {loading ? "..." : totalPoints}
                </div>
              </div>
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Badges Unlocked</span>
                  <Medal className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl font-bold gradient-text">
                  {loading ? "..." : `${unlocked.length} / ${achievements.length}`}
                </div>
              </div>
              <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Best Streak</span>
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-3xl font-bold gradient-text">
                  {loading ? "..." : (
                    streaks
                      ? Math.max(streaks.meditation.best, streaks.journal.best, streaks.mood.best)
                      : 0
                  )} days
                </div>
              </div>
            </div>

            {/* Streaks */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Current Streaks</h3>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading streaks...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
                  <StreakCard
                    label="Meditation"
                    icon="🧘"
                    current={streaks?.meditation.current ?? 0}
                    best={streaks?.meditation.best ?? 0}
                  />
                  <StreakCard
                    label="Journaling"
                    icon="📓"
                    current={streaks?.journal.current ?? 0}
                    best={streaks?.journal.best ?? 0}
                  />
                  <StreakCard
                    label="Mood Check-ins"
                    icon="💙"
                    current={streaks?.mood.current ?? 0}
                    best={streaks?.mood.best ?? 0}
                  />
                </div>
              )}
            </div>

            {/* Unlocked Badges */}
            {!loading && unlocked.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">🏆 Unlocked Badges</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in-up">
                  {unlocked.map((badge) => (
                    <BadgeCard key={badge.badge} badge={badge} />
                  ))}
                </div>
              </div>
            )}

            {/* Locked Badges */}
            {!loading && locked.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">🔒 Locked Badges</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in-up">
                  {locked.map((badge) => (
                    <BadgeCard key={badge.badge} badge={badge} />
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="text-sm text-muted-foreground">Loading badges...</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AchievementsPage;
