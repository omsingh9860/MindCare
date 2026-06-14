import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Mail, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signup as apiSignup } from "@/lib/auth";

const PASSWORD_REQUIREMENTS = [
  { label: "At least 10 characters", test: (value: string) => value.length >= 10 },
  { label: "One uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { label: "One number", test: (value: string) => /\d/.test(value) },
  { label: "One special character", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const nav = useNavigate();

  const passwordChecks = useMemo(
    () => PASSWORD_REQUIREMENTS.map((requirement) => ({ ...requirement, ok: requirement.test(password) })),
    [password]
  );

  const strengthScore = passwordChecks.filter((check) => check.ok).length;
  const strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"][strengthScore];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (strengthScore < PASSWORD_REQUIREMENTS.length) {
      toast({
        title: "Weak password",
        description: "Please satisfy all password requirements",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiSignup(name, email, password);
      toast({ title: "Success", description: result.message || "Please verify your email to continue" });
      nav("/login", { replace: true });
    } catch (err: any) {
      toast({
        title: "Signup failed",
        description: err?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">Start your wellness journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

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
              <div className="rounded-md border border-border p-3 text-xs space-y-1">
                <p className="font-medium">Password strength: {strengthLabel}</p>
                <div className="h-2 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${(strengthScore / 5) * 100}%` }} />
                </div>
                <ul className="space-y-1 text-muted-foreground">
                  {passwordChecks.map((check) => (
                    <li key={check.label} className={check.ok ? "text-green-600" : ""}>
                      {check.ok ? "✓" : "•"} {check.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 py-6" disabled={submitting}>
              {submitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:text-accent smooth-transition font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
