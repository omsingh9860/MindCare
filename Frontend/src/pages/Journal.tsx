import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Trash2, X } from "lucide-react";
import {
  createJournalEntry,
  deleteJournalEntry,
  listJournalEntries,
  type JournalEntry,
} from "@/lib/journal";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const Journal = () => {
  const [title, setTitle] = useState("");
  const [entry, setEntry] = useState("");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { toast } = useToast();

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  async function loadEntries() {
    setLoading(true);
    try {
      const data = await listJournalEntries();
      setEntries(data);
    } catch (err: any) {
      toast({
        title: "Failed to load journal entries",
        description: err?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !entry.trim()) {
      toast({
        title: "Incomplete Entry",
        description: "Please add both a title and content",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await createJournalEntry(title, entry);

      toast({
        title: "Entry Saved!",
        description: "Your journal entry has been recorded successfully.",
      });

      setTitle("");
      setEntry("");
      await loadEntries();
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

  async function handleDeleteSelected() {
    if (!selected) return;

    setDeleting(true);
    try {
      await deleteJournalEntry(selected.id);
      toast({ title: "Deleted", description: "Journal entry deleted." });
      setSelected(null);
      await loadEntries();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-12 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="w-10 h-10 text-primary" />
              <h1 className="text-4xl font-bold">
                Your <span className="gradient-text">Journal</span>
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Express your thoughts and feelings in a safe, private space
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl animate-fade-in-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-lg">
                  Entry Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="What's on your mind today?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="text-sm text-muted-foreground">{todayLabel}</div>

              <div className="space-y-2">
                <Label htmlFor="entry" className="text-lg">
                  Your Thoughts
                </Label>
                <Textarea
                  id="entry"
                  placeholder="Write freely... Let your thoughts flow without judgment."
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  className="min-h-96 text-base leading-relaxed"
                />
                <p className="text-xs text-muted-foreground">
                  {entry.length} characters
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="bg-primary hover:bg-primary/90 flex-1"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Entry"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setTitle("");
                    setEntry("");
                  }}
                  disabled={saving}
                >
                  Clear
                </Button>
              </div>
            </form>
          </div>

          {/* Recent Entries */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold mb-2">Recent Entries</h2>
              <Button variant="outline" onClick={loadEntries} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>

            {loading ? (
              <div className="text-sm text-muted-foreground">Loading entries...</div>
            ) : entries.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No entries yet. Write your first one above.
              </div>
            ) : (
              entries.slice(0, 20).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelected(e)}
                  className="w-full text-left glass-card p-6 rounded-xl hover-lift smooth-transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{e.title}</h3>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(e.createdAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">{e.content}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </main>

      {/* View modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onMouseDown={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl bg-background rounded-xl border p-6"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{selected.title}</h2>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatDate(selected.createdAt)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleting ? "Deleting..." : "Delete"}
                </Button>

                <Button variant="outline" onClick={() => setSelected(null)}>
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>

            <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {selected.content}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Journal;