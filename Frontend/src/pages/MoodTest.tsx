import { useMemo, useState } from "react";
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
  LIKERT_5,
  pickRandomQuestions,
  normalizedScore,
  type MoodQuestion,
} from "@/lib/moodQuestions";

type AnswerMap = Record<string, number>; // questionId -> 1..5

function computeWellbeing(questions: MoodQuestion[], answers: AnswerMap) {
  // 1. Only calculate based on questions the user ACTUALLY answered
  const answeredQuestions = questions.filter((q) => answers[q.id] !== undefined);
  const answeredCount = answeredQuestions.length;

  if (answeredCount === 0) {
    return { answeredCount, percent: 0, totalNormalized: 0, max: 0 };
  }

  // 2. Calculate the Zero-Baseline Score (0 to 4 points per question)
  const totalScore = answeredQuestions.reduce((sum, q) => {
    const v = answers[q.id];
    
    // If negative question: 1 is best (4 pts), 5 is worst (0 pts)
    // If positive question: 5 is best (4 pts), 1 is worst (0 pts)
    const score0to4 = q.negative ? (5 - v) : (v - 1);
    
    return sum + score0to4;
  }, 0);

  // 3. Max possible score is now 4 points per answered question
  const maxPossible = answeredCount * 4; 
  const percent = Math.round((totalScore / maxPossible) * 100);

  return { 
    answeredCount, 
    percent, 
    totalNormalized: totalScore, 
    max: maxPossible 
  };
}

const MoodTest = () => {
  const [questions, setQuestions] = useState<MoodQuestion[]>(() => pickRandomQuestions(5, 10));
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const wellbeing = useMemo(() => computeWellbeing(questions, answers), [questions, answers]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: Number(value) }));
  };

  const canRegenerate = Object.keys(answers).length === 0;

  const regenerate = () => {
    if (!canRegenerate) return;
    setQuestions(pickRandomQuestions(5, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (wellbeing.answeredCount < questions.length) {
      toast({
        title: "Incomplete Test",
        description: "Please answer all questions",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Keep payload compatible with backend: Record<string, string>
      // (key by question text for readability in DB/exports)
      const answersPayload: Record<string, string> = {};
      for (const q of questions) {
        const v = answers[q.id]; // 1..5
        const label = LIKERT_5.find((o) => o.value === v)?.label ?? String(v);
        answersPayload[q.question] = `${label} (${v}/5)`;
      }

      // Optional: include score summary into notes so it’s saved too
      const notesWithScore = notes?.trim()
        ? `${notes.trim()}\n\nWellbeing Score: ${wellbeing.percent}/100`
        : `Wellbeing Score: ${wellbeing.percent}/100`;

      await createMoodAssessment(answersPayload, notesWithScore);

      toast({
        title: "Test Completed!",
        description: "Your mood has been recorded. Check your dashboard for insights.",
      });

      setTimeout(() => navigate("/dashboard"), 800);
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
          </div>




          <form onSubmit={handleSubmit} className="space-y-8">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="glass-card p-6 rounded-xl animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold mb-4">
                    {index + 1}. {q.question}
                  </h3>

                  <div className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground whitespace-nowrap">
                    {q.category}
                  </div>
                </div>

                <RadioGroup
                  onValueChange={(value) => handleAnswerChange(q.id, value)}
                  value={answers[q.id] ? String(answers[q.id]) : undefined}
                >
                  <div className="space-y-3">
                    {LIKERT_5.map((option) => (
                      <div key={option.value} className="flex items-center space-x-3">
                        <RadioGroupItem
                          value={String(option.value)}
                          id={`q${q.id}-${option.value}`}
                        />
                        <Label
                          htmlFor={`q${q.id}-${option.value}`}
                          className="cursor-pointer flex-1 py-2"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                <p className="mt-3 text-xs text-muted-foreground">
                  Question score:{" "}
                  {answers[q.id] ? normalizedScore(answers[q.id], q.negative) : "—"} / 5
                </p>
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
                disabled={saving}
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