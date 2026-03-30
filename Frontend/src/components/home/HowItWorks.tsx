import { ClipboardCheck, BookOpen, Brain, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Take the Mood Test",
    description: "Answer quick questions about your current emotional state and get instant insights.",
  },
  {
    icon: BookOpen,
    title: "Journal Your Thoughts",
    description: "Express your feelings through daily journaling and track patterns over time.",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Our AI processes your data to identify trends and provide personalized recommendations.",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Monitor your mental health journey with beautiful visualizations and actionable tips.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Four simple steps to start your mental wellness journey
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="glass-card p-6 rounded-2xl hover-lift smooth-transition h-full">
                {/* Number Badge */}
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary/20 border border-primary flex items-center justify-center font-bold text-primary">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 smooth-transition">
                  <step.icon className="w-8 h-8 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
