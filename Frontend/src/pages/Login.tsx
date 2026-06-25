import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  login as apiLogin,
  requestPasswordReset,
  resetPassword,
  resendVerification,
  verifyEmail,
} from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const { toast } = useToast();
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const verifyToken = useMemo(() => searchParams.get("verifyToken") || "", [searchParams]);
  const resetToken = useMemo(() => searchParams.get("resetToken") || "", [searchParams]);

  useEffect(() => {
    if (!verifyToken) return;

    (async () => {
      try {
        setLoading(true);
        await verifyEmail(verifyToken);
        await refresh();
        toast({ title: "Email verified", description: "Welcome to MindCare" });
        nav("/dashboard", { replace: true });
      } catch (err: any) {
        toast({
          title: "Verification failed",
          description: err?.response?.data?.message || "Verification link is invalid or expired",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [nav, refresh, toast, verifyToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await apiLogin(email, password, rememberMe);
      await refresh();
      toast({ title: "Success", description: "Logged in successfully" });
      nav("/dashboard", { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.message || "Something went wrong";
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetLink = async () => {
    if (!email) {
      toast({ title: "Enter your email", description: "Provide your account email first", variant: "destructive" });
      return;
    }

    try {
      setSendingReset(true);
      const result = await requestPasswordReset(email);
      toast({ title: "Reset link sent", description: result.message });
    } catch (err: any) {
      toast({
        title: "Request failed",
        description: err?.response?.data?.message || "Unable to send reset link",
        variant: "destructive",
      });
    } finally {
      setSendingReset(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmNewPassword) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const result = await resetPassword(resetToken, newPassword);
      toast({ title: "Success", description: result.message });
      searchParams.delete("resetToken");
      setSearchParams(searchParams, { replace: true });
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      toast({
        title: "Reset failed",
        description: err?.response?.data?.message || "Unable to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast({ title: "Enter your email", description: "Provide your account email first", variant: "destructive" });
      return;
    }

    try {
      setResendingVerification(true);
      const result = await resendVerification(email);
      toast({ title: "Verification email sent", description: result.message });
    } catch (err: any) {
      toast({
        title: "Request failed",
        description: err?.response?.data?.message || "Unable to resend verification email",
        variant: "destructive",
      });
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Brain className="w-10 h-10 text-primary" />
          <span className="text-2xl font-bold gradient-text">MindCare</span>
        </Link>

        <div className="glass-card p-8 rounded-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{resetToken ? "Reset Password" : "Welcome Back"}</h1>
            <p className="text-muted-foreground">
              {resetToken ? "Set your new secure password" : "Sign in to continue your journey"}
            </p>
          </div>

          {resetToken ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 py-6" disabled={loading}>
                {loading ? "Updating Password..." : "Reset Password"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="rememberMe" className="cursor-pointer">
                    Remember me
                  </Label>
                </div>

                <button
                  type="button"
                  onClick={handleSendResetLink}
                  disabled={sendingReset}
                  className="text-sm text-primary hover:text-accent smooth-transition"
                >
                  {sendingReset ? "Sending..." : "Forgot password?"}
                </button>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 py-6" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/signup" className="text-primary hover:text-accent smooth-transition font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
