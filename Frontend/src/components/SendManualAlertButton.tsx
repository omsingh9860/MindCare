import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sendCrisisAlert } from "@/lib/crisis";

export function SendManualAlertButton({ userName }: { userName?: string }) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  async function sendNow() {
    setSending(true);
    try {
      const data = await sendCrisisAlert(userName);
      toast({
        title: "Alert sent",
        description: `Sent to: ${data.sentTo.join(", ")}`,
      });
    } catch (err: any) {
      toast({
        title: "Send failed",
        description:
          err?.response?.data?.message || err?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Button variant="destructive" onClick={sendNow} disabled={sending}>
      {sending ? "Sending..." : "Send Alert Now"}
    </Button>
  );
}