import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createMoodAssessment } from "@/lib/mood";
import {
  LIKERT_OPTIONS,
  computeMoodScore,
  formatAnswerForStorage,
  pickRandomQuestions,
} from "@/lib/moodQuestions";
import type { MoodQuestion } from "@/lib/moodQuestions";

const MoodTest = () => {
  const SCORE_DISPLAY_DURATION_MS = 2500;
  // Pick a fresh random set of questions once when the component mounts.
  const [questions] = useState<MoodQuestion[]>(() => pickRandomQuestions(5, 10));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [scoreResult, setScoreResult] = useState<number | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const progressPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  // Live preview score (null until at least one answer)
  const liveScore = computeMoodScore(questions, answers);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (answeredCount < totalCount) {
      toast({
        title: "Incomplete Test",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Build the payload: stable question-id keys, formatted answer strings.
    const formattedAnswers: Record<string, string> = {};
    for (const q of questions) {
      const raw = answers[q.id];
      if (raw) {
        formattedAnswers[q.id] = formatAnswerForStorage(raw, q.negative);
      }
    }

    setSaving(true);
    try {
      await createMoodAssessment(formattedAnswers, notes);

      const finalScore = computeMoodScore(questions, answers);
      setScoreResult(finalScore);

      toast({
        title: "Test Completed!",
        description: "Your mood has been recorded. Check your dashboard for insights.",
      });

      setTimeout(() => navigate("/dashboard"), SCORE_DISPLAY_DURATION_MS);
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const scoreLabel = (score: number) => {
    if (score >= 80) return { text: "Excellent", color: "text-green-500" };
    if (score >= 60) return { text: "Good", color: "text-blue-500" };
    if (score >= 40) return { text: "Fair", color: "text-yellow-500" };
    if (score >= 20) return { text: "Low", color: "text-orange-500" };
    return { text: "Poor", color: "text-red-500" };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">
              Mood <span className="gradient-text">Assessment</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Take a moment to check in with yourself
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {totalCount} questions · unique set every session
            </p>
          </div>

          {/* Score result banner (shown after successful submit) */}
          {scoreResult !== null && (
            <div className="glass-card p-6 rounded-xl mb-8 text-center animate-fade-in">
              <p className="text-muted-foreground mb-1">Your Wellbeing Score</p>
              <p className={`text-5xl font-bold mb-2 ${scoreLabel(scoreResult).color}`}>
                {scoreResult}
                <span className="text-2xl text-muted-foreground">/100</span>
              </p>
              <p className={`text-lg font-semibold ${scoreLabel(scoreResult).color}`}>
                {scoreLabel(scoreResult).text}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Redirecting to your dashboard…
              </p>
            </div>
          )}

          {/* Progress bar */}
          <div className="mb-6 animate-fade-in">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>{answeredCount} of {totalCount} answered</span>
              {liveScore !== null && (
                <span className={scoreLabel(liveScore).color}>
                  Live score: {liveScore}/100
                </span>
              )}
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full smooth-transition"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="glass-card p-6 rounded-xl animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="text-lg font-semibold mb-4">
                  {index + 1}. {q.question}
                </h3>

                <RadioGroup
                  onValueChange={(value) => handleAnswerChange(q.id, value)}
                  value={answers[q.id]}
                >
                  <div className="space-y-3">
                    {LIKERT_OPTIONS.map((option) => (
                      <div key={option} className="flex items-center space-x-3">
                        <RadioGroupItem value={option} id={`${q.id}-${option}`} />
                        <Label
                          htmlFor={`${q.id}-${option}`}
                          className="cursor-pointer flex-1 py-2"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            ))}

            <div className="glass-card p-6 rounded-xl animate-fade-in-up">
              <Label htmlFor="notes" className="text-lg font-semibold mb-4 block">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Share any thoughts or feelings you'd like to record..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-32"
              />
            </div>

            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={saving || scoreResult !== null}
                className="bg-primary hover:bg-primary/90 px-12 py-6 text-lg"
              >
                {saving ? "Saving..." : "Submit Assessment"}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MoodTest;