import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { startCrisisAutoAlert, cancelCrisisAutoAlert } from "@/lib/crisis";
import { useToast } from "@/hooks/use-toast";

export default function CrisisAutoTestCard({ userName }: { userName?: string }) {
  const { toast } = useToast();

  const [alertId, setAlertId] = useState<string | null>(null);
  const [sendAt, setSendAt] = useState<string | null>(null);
  const [delaySeconds, setDelaySeconds] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);

  // live countdown for scheduled send
  const remainingSeconds = useMemo(() => {
    if (!sendAt) return null;
    const ms = new Date(sendAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / 1000));
  }, [sendAt]);

  // re-render while scheduled countdown is active
  useEffect(() => {
    if (!sendAt) return;
    const t = setInterval(() => setSendAt((x) => x), 250);
    return () => clearInterval(t);
  }, [sendAt]);

  // cooldown countdown
  useEffect(() => {
    if (cooldownSeconds === null) return;
    if (cooldownSeconds <= 0) {
      setCooldownSeconds(null);
      return;
    }
    const t = setInterval(() => {
      setCooldownSeconds((s) => (s === null ? null : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownSeconds]);

  // when countdown reaches 0, hide cancel + clear UI shortly after
  useEffect(() => {
    if (!alertId || remainingSeconds === null) return;
    if (remainingSeconds > 0) return;

    // at this point the send window is over; cancel should no longer be shown
    toast({
      title: "Sent",
      description: "The countdown ended. The alert should be sending now.",
    });

    const t = setTimeout(() => {
      // clear scheduled state so the card goes back to "Start" mode
      setAlertId(null);
      setSendAt(null);
      setDelaySeconds(null);
    }, 2000);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, alertId]);

  async function start() {
    setBusy(true);
    try {
      setCooldownSeconds(null);

      const data = await startCrisisAutoAlert(userName);

      setAlertId(data.alertId);
      setSendAt(data.sendAt);
      setDelaySeconds(data.delaySeconds);

      toast({
        title: "Scheduled",
        description: `Auto alert will send in ${data.delaySeconds}s unless cancelled.`,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 429) {
        if (typeof data?.retryAfterSeconds === "number") {
          setCooldownSeconds(data.retryAfterSeconds);
        }
        toast({
          title: "Cooldown",
          description: data?.message || "Please wait before triggering again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Failed",
        description: data?.message || err?.message || "Could not start alert",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!alertId) return;
    setBusy(true);
    try {
      await cancelCrisisAutoAlert(alertId);

      setAlertId(null);
      setSendAt(null);
      setDelaySeconds(null);

      toast({ title: "Cancelled", description: "Auto alert cancelled." });
    } catch (err: any) {
      const data = err?.response?.data;
      toast({
        title: "Failed",
        description: data?.message || err?.message || "Could not cancel alert",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  const canCancel = alertId && remainingSeconds !== null && remainingSeconds > 0;

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground p-6 space-y-3">
      <h3 className="text-lg font-semibold">Auto Alert Test</h3>

      {!alertId ? (
        <div className="space-y-2">
          <Button onClick={start} disabled={busy || cooldownSeconds !== null}>
            {busy
              ? "Starting..."
              : cooldownSeconds !== null
                ? `Cooldown (${cooldownSeconds}s)`
                : "Start auto countdown"}
          </Button>

          {cooldownSeconds !== null ? (
            <p className="text-xs text-muted-foreground">
              You can trigger again in {cooldownSeconds}s.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm">
            Scheduled{delaySeconds ? ` (${delaySeconds}s)` : ""}.{" "}
            {remainingSeconds !== null ? (
              remainingSeconds > 0 ? (
                <span className="font-semibold">Sending in {remainingSeconds}s</span>
              ) : (
                <span className="font-semibold">Sending now…</span>
              )
            ) : null}
          </div>

          {canCancel ? (
            <Button variant="destructive" onClick={cancel} disabled={busy}>
              {busy ? "Cancelling..." : "Cancel"}
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Cancel window ended
            </Button>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        This is for testing. In real usage, auto mode triggers only for high-risk
        entries.
      </p>
    </div>
  );
}