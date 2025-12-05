import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ClipboardList, Loader2, RefreshCcw } from "lucide-react";

import type { QuizAnswer } from "../app/App";

type SubmissionsMenuProps = {
  submissions: QuizAnswer[];
  onReevaluate: () => void;
  isReevaluating: boolean;
};

const formatSubmittedAt = (timestamp?: string) => {
  if (!timestamp) return "Submission time unavailable";
  const parsedDate = new Date(timestamp);
  if (Number.isNaN(parsedDate.getTime())) return "Submission time unavailable";
  return parsedDate.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const parseDate = (timestamp?: string) => {
  if (!timestamp) return 0;
  const parsedDate = new Date(timestamp).getTime();
  return Number.isNaN(parsedDate) ? 0 : parsedDate;
};

export function SubmissionsMenu({ submissions, onReevaluate, isReevaluating }: SubmissionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const sortedSubmissions = useMemo(
    () => [...submissions].sort((a, b) => parseDate(b.submittedAt) - parseDate(a.submittedAt)),
    [submissions],
  );
  const flaggedCount = submissions.filter((submission) => submission.flagged).length;
  const flaggedPercent = submissions.length ? Math.round((flaggedCount / submissions.length) * 100) : 0;

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
      >
        <ClipboardList className="h-4 w-4" />
        Submissions
        <span className="text-xs font-medium text-gray-500">({flaggedPercent}% flagged)</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-30 mt-3 w-[420px] max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Course submissions
              </p>
              <p className="text-sm text-gray-600">
                {submissions.length} total • {flaggedCount} flagged
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                onReevaluate();
              }}
              disabled={isReevaluating}
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isReevaluating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Re-evaluating
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4" />
                  Re-evaluate all
                </>
              )}
            </button>
          </div>
          {sortedSubmissions.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              No submissions found for this course yet.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sortedSubmissions.map((submission) => {
                const aiScore = Number.isFinite(submission.aiProbability) ? submission.aiProbability : 0;
                const aiPercent = Math.round(Math.max(aiScore, 0) * 100);
                const aiColor =
                  aiPercent >= 60 ? "text-red-600" : aiPercent >= 30 ? "text-orange-500" : "text-emerald-600";
                return (
                  <li key={`${submission.id}-${submission.studentId}`} className="flex items-center gap-3 px-4 py-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xs font-semibold uppercase text-gray-600">
                      {(submission.testType ?? "Q").slice(0, 1)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {submission.topicName ?? `Submission #${submission.id}`}
                      </p>
                      <p className="text-xs text-gray-600">
                        {submission.studentName ?? submission.studentEmail ?? "Unknown student"}
                      </p>
                      <p className="text-xs text-gray-400">{formatSubmittedAt(submission.submittedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${aiColor}`}>{aiPercent}% AI</p>
                      <p className={`text-xs font-semibold ${submission.flagged ? "text-red-600" : "text-emerald-600"}`}>
                        {submission.flagged ? "Flagged" : "Clear"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
