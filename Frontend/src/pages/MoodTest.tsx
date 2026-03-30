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

const questions = [
  {
    id: 1,
    question: "How would you describe your overall mood today?",
    options: ["Very Good", "Good", "Neutral", "Not Good", "Very Bad"],
  },
  {
    id: 2,
    question: "How well did you sleep last night?",
    options: ["Excellent", "Good", "Fair", "Poor", "Very Poor"],
  },
  {
    id: 3,
    question: "How energetic do you feel right now?",
    options: ["Very Energetic", "Energetic", "Moderate", "Low Energy", "Exhausted"],
  },
  {
    id: 4,
    question: "How stressed are you feeling?",
    options: ["Not at all", "A little", "Moderately", "Very", "Extremely"],
  },
];

const MoodTest = () => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.keys(answers).length < questions.length) {
      toast({
        title: "Incomplete Test",
        description: "Please answer all questions",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await createMoodAssessment(answers, notes);

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
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="text-lg font-semibold mb-4">
                  {q.id}. {q.question}
                </h3>

                <RadioGroup
                  onValueChange={(value) => handleAnswerChange(q.id, value)}
                  value={answers[q.id]}
                >
                  <div className="space-y-3">
                    {q.options.map((option) => (
                      <div key={option} className="flex items-center space-x-3">
                        <RadioGroupItem value={option} id={`q${q.id}-${option}`} />
                        <Label
                          htmlFor={`q${q.id}-${option}`}
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