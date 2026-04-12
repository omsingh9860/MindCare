import type { MlOutput } from "@/lib/journal";

interface MoodInsightProps {
  ml?: MlOutput;
  onMarkForAnalysis?: () => void;
  isResetting?: boolean;
}

export function MoodInsight({ ml, onMarkForAnalysis, isResetting }: MoodInsightProps) {
  if (!ml) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <span className="font-medium">Mood Insight:</span> Not analyzed yet.
        {onMarkForAnalysis && (
          <button
            type="button"
            onClick={onMarkForAnalysis}
            disabled={isResetting}
            className="ml-2 underline text-primary disabled:opacity-50"
          >
            {isResetting ? "Queuing…" : "Queue for analysis"}
          </button>
        )}
      </div>
    );
  }

  if (ml.status === "pending") {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span>
          <span className="font-medium">Mood Insight:</span> Analysis pending — results will appear here once
          the ML service processes this entry.
        </span>
        {onMarkForAnalysis && (
          <button
            type="button"
            onClick={onMarkForAnalysis}
            disabled={isResetting}
            className="ml-2 underline text-primary disabled:opacity-50"
          >
            {isResetting ? "Queuing…" : "Reset"}
          </button>
        )}
      </div>
    );
  }

  if (ml.status === "failed") {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <span className="font-medium text-destructive">Mood Insight:</span>{" "}
        Analysis failed.{ml.error ? ` (${ml.error})` : ""}
        {onMarkForAnalysis && (
          <button
            type="button"
            onClick={onMarkForAnalysis}
            disabled={isResetting}
            className="ml-2 underline text-primary disabled:opacity-50"
          >
            {isResetting ? "Queuing…" : "Retry"}
          </button>
        )}
      </div>
    );
  }

  // status === "completed"
  return (
    <div className="rounded-lg border p-4 space-y-2 text-sm">
      <div className="font-semibold text-base">Mood Insight</div>
      <div className="grid grid-cols-2 gap-2">
        {ml.primaryEmotion && (
          <div>
            <span className="text-muted-foreground">Primary Emotion: </span>
            <span className="font-medium capitalize">{ml.primaryEmotion}</span>
          </div>
        )}
        {ml.secondaryEmotion && (
          <div>
            <span className="text-muted-foreground">Secondary Emotion: </span>
            <span className="font-medium capitalize">{ml.secondaryEmotion}</span>
          </div>
        )}
        {ml.emotionType && (
          <div>
            <span className="text-muted-foreground">Emotion Type: </span>
            <span className="font-medium capitalize">{ml.emotionType}</span>
          </div>
        )}
        {ml.confidence !== undefined && (
          <div>
            <span className="text-muted-foreground">Confidence: </span>
            <span className="font-medium">{(ml.confidence * 100).toFixed(0)}%</span>
          </div>
        )}
        {ml.score !== undefined && (
          <div>
            <span className="text-muted-foreground">Score: </span>
            <span className="font-medium">{ml.score}</span>
          </div>
        )}
      </div>
      {onMarkForAnalysis && (
        <button
          type="button"
          onClick={onMarkForAnalysis}
          disabled={isResetting}
          className="text-xs underline text-muted-foreground disabled:opacity-50"
        >
          {isResetting ? "Queuing…" : "Re-analyze"}
        </button>
      )}
    </div>
  );
}
