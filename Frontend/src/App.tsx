import { Navigate, Routes, Route } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import ProtectedRoute from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import LoginPage from "@/pages/Login";
import SignupPage from "@/pages/Signup";
import DashboardPage from "@/pages/Dashboard";
import JournalPage from "@/pages/Journal";
import MoodTestPage from "@/pages/MoodTest";
import MeditationPage from "@/pages/Meditation";
import TipsPage from "@/pages/Tips";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import AchievementsPage from "@/pages/Achievements";
import AnalyticsPage from "@/pages/Analytics";
import LeaderboardPage from "@/pages/Leaderboard";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/mood-test" element={<MoodTestPage />} />
        <Route path="/meditation" element={<MeditationPage />} />
        <Route path="/tips" element={<TipsPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}