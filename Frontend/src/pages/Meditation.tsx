import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Play, Pause, Clock } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { logMeditation } from "@/lib/meditation";
import { useNavigate } from "react-router-dom";

// 1. Added placeholder audio URLs to your sessions. 
// Replace these with links to your actual MP3 files or cloud storage URLs.
const sessions = [
  {
    id: 1,
    title: "Morning Mindfulness",
    duration: "10 min",
    description: "Start your day with calm and focus",
    category: "Morning",
    audioUrl: "/audio/track1.mp3",
  },
  {
    id: 2,
    title: "Stress Relief",
    duration: "15 min",
    description: "Release tension and find peace",
    category: "Stress",
    audioUrl: "/audio/track2.mp3",
  },
  {
    id: 3,
    title: "Sleep Preparation",
    duration: "20 min",
    description: "Wind down for restful sleep",
    category: "Sleep",
    audioUrl: "/audio/track3.mp3",
  },
  {
    id: 4,
    title: "Anxiety Management",
    duration: "12 min",
    description: "Calm your mind and ease worries",
    category: "Anxiety",
    audioUrl: "/audio/track4.mp3",
  },
  {
    id: 5,
    title: "Energy Boost",
    duration: "8 min",
    description: "Refresh and energize your day",
    category: "Energy",
    audioUrl: "/audio/track5.mp3",
  },
  {
    id: 6,
    title: "Deep Relaxation",
    duration: "25 min",
    description: "Complete body and mind relaxation",
    category: "Relaxation",
    audioUrl: "/audio/track6.mp3",
  },
];

const Meditation = () => {
  const [playing, setPlaying] = useState<number | null>(null);
  const [logging, setLogging] = useState(false);
  const { toast } = useToast();
  const nav = useNavigate();
  
  // 2. Added a ref to control the HTML audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleToggle = async (sessionId: number) => {
    const session = sessions.find((x) => x.id === sessionId);
    if (!session || !audioRef.current) return;

    // Pause/finish current session => log it
    if (playing === sessionId) {
      // 3. Get the EXACT time listened directly from the audio element
      const listenedSeconds = audioRef.current.currentTime;
      const listenedMinutes = Math.ceil(listenedSeconds / 60); // Rounds up to give them credit for partial minutes

      // Pause the audio and reset it
      audioRef.current.pause();
      setLogging(true);

      try {
        // Only log to the database if they listened for more than 5 seconds to prevent spam
        if (listenedSeconds > 5) {
          await logMeditation(session.title, listenedMinutes);
          toast({
            title: "Session logged",
            description: `Logged ${listenedMinutes} minute(s) of ${session.title}.`,
          });
          nav("/dashboard?refresh=1", { replace: true });
        } else {
          toast({
            title: "Session ended",
            description: "Session was too short to log.",
          });
        }
      } catch (err: any) {
        toast({
          title: "Could not log session",
          description: err?.response?.data?.message || "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setLogging(false);
        setPlaying(null);
        audioRef.current.currentTime = 0; // Reset audio track
      }
      return;
    }

    // Start a new session
    // If another track was playing, pause it first
    if (playing !== null) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Load the new track and play
    setPlaying(sessionId);
    audioRef.current.src = session.audioUrl;
    
    // Play returns a promise, it's good practice to catch errors (e.g., browser autoplay blocks)
    audioRef.current.play().catch((error) => {
      console.error("Audio playback failed:", error);
      toast({
        title: "Playback Error",
        description: "Please click again to allow audio playback.",
        variant: "destructive",
      });
      setPlaying(null);
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold mb-4">
              Guided <span className="gradient-text">Meditation</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find peace and clarity with our curated meditation sessions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session, index) => (
              <div
                key={session.id}
                className="glass-card p-6 rounded-xl hover-lift smooth-transition animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {session.category}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{session.duration}</span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-2">{session.title}</h3>
                <p className="text-muted-foreground mb-6">{session.description}</p>

                <Button
                  onClick={() => handleToggle(session.id)}
                  disabled={logging || (playing !== null && playing !== session.id)} // Prevent starting a new one while logging or playing another
                  className={`w-full ${
                    playing === session.id
                      ? "bg-accent hover:bg-accent/90"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {playing === session.id ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      {logging ? "Logging..." : "Pause & Log"}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      {playing !== null ? "Session in progress" : "Start Session"}
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Tip: Start a session, then click Pause to log your actual time listened to your weekly total.
          </p>
          
          {/* 4. The hidden audio element that handles the actual playback */}
          <audio ref={audioRef} className="hidden" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Meditation;