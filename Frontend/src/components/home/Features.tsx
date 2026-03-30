import { Heart, BookOpen, Brain, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Heart,
    title: "Mood Test",
    description: "Quick and accurate mood assessments powered by AI to understand your emotional state.",
    link: "/mood-test",
    gradient: "from-primary to-accent",
  },
  {
    icon: BookOpen,
    title: "Personal Journal",
    description: "Express yourself freely and track your thoughts with our secure, private journaling system.",
    link: "/journal",
    gradient: "from-secondary to-primary",
  },
  {
    icon: Brain,
    title: "Guided Meditation",
    description: "Relax your mind with curated meditation sessions designed for various moods and needs.",
    link: "/meditation",
    gradient: "from-accent to-secondary",
  },
  {
    icon: Lightbulb,
    title: "Wellness Tips",
    description: "Get personalized mental health tips and resources based on your unique journey.",
    link: "/tips",
    gradient: "from-primary to-secondary",
  },
];

const Features = () => {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to monitor and improve your mental wellbeing
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="glass-card p-8 rounded-2xl group hover-lift smooth-transition animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 smooth-transition`}
              >
                <feature.icon className="w-8 h-8 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground mb-6">{feature.description}</p>

              {/* CTA */}
              <Link to={feature.link}>
                <Button variant="ghost" className="group/btn p-0 h-auto hover:bg-transparent">
                  <span className="text-primary group-hover/btn:text-accent smooth-transition">
                    Learn more →
                  </span>
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
