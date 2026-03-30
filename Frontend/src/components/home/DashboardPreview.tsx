import { TrendingUp, Smile, AlertCircle } from "lucide-react";

const DashboardPreview = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Track Your <span className="gradient-text">Progress</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Visualize your mental health journey with beautiful, actionable insights
          </p>
        </div>

        {/* Dashboard Mockup */}
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-8 rounded-3xl animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold">Your Dashboard</h3>
              <div className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                Last 7 Days
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Mood Score */}
              <div className="gradient-card p-6 rounded-xl border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Mood Score</span>
                  <Smile className="w-5 h-5 text-accent" />
                </div>
                <div className="text-3xl font-bold gradient-text mb-1">8.2</div>
                <div className="flex items-center gap-1 text-sm text-accent">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12% from last week</span>
                </div>
              </div>

              {/* Journal Entries */}
              <div className="gradient-card p-6 rounded-xl border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Journal Entries</span>
                  <AlertCircle className="w-5 h-5 text-secondary" />
                </div>
                <div className="text-3xl font-bold gradient-text mb-1">23</div>
                <div className="text-sm text-muted-foreground">This month</div>
              </div>

              {/* Meditation Time */}
              <div className="gradient-card p-6 rounded-xl border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Meditation</span>
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl font-bold gradient-text mb-1">4.5h</div>
                <div className="text-sm text-muted-foreground">Total this week</div>
              </div>
            </div>

            {/* Mock Graph */}
            <div className="gradient-card p-6 rounded-xl border border-border/50">
              <h4 className="text-lg font-semibold mb-4">Mood Trends</h4>
              <div className="h-48 flex items-end justify-between gap-2">
                {[6, 7, 5, 8, 9, 7, 8].map((value, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-gradient-primary rounded-t-lg smooth-transition hover:opacity-80"
                    style={{ height: `${(value / 10) * 100}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>

            {/* AI Tip Card */}
            <div className="mt-6 gradient-card p-6 rounded-xl border border-primary/30">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">AI Insight</h4>
                  <p className="text-sm text-muted-foreground">
                    Your mood scores are trending upward! Keep up the great work with your
                    daily meditation practice. Consider adding an extra 10 minutes this week.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
