import { useState } from "react";
import { AlertCircle, Check, FileText, Upload } from "lucide-react";

import type { CourseTopic, QuizAnswer, Student } from "../app/App";
import type { CourseTopicPayload, StudentPayload, SubmissionPayload } from "../lib/api";

type ImportKind = "topics" | "students" | "answers";

type DataImportProps = {
  courseTopics: CourseTopic[];
  students: Student[];
  quizAnswers: QuizAnswer[];
  onImportTopics: (payload: CourseTopicPayload[]) => Promise<unknown>;
  onImportStudents: (payload: StudentPayload[]) => Promise<unknown>;
  onImportSubmissions: (payload: SubmissionPayload[]) => Promise<unknown>;
  onLoadSampleData: () => Promise<void>;
  isLoading?: boolean;
  isProcessing?: boolean;
};

type MessageState = {
  text: string;
  tone: "success" | "error";
};

export function DataImport({
  courseTopics,
  students,
  quizAnswers,
  onImportTopics,
  onImportStudents,
  onImportSubmissions,
  onLoadSampleData,
  isLoading,
  isProcessing,
}: DataImportProps) {
  const [message, setMessage] = useState<MessageState | null>(null);

  const withStatus = async (callback: () => Promise<unknown>, successText: string) => {
    try {
      await callback();
      setMessage({ text: successText, tone: "success" });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unexpected error";
      setMessage({ text: detail, tone: "error" });
    } finally {
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const parseCsv = (text: string) =>
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: ImportKind) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length < 2) {
      setMessage({ text: "CSV file is empty.", tone: "error" });
      event.target.value = "";
      return;
    }

    const payloadRows = rows.slice(1).map((line) => line.split(",").map((value) => value.trim()));
    try {
      if (type === "topics") {
        const topics: CourseTopicPayload[] = payloadRows
          .map((values) => {
            const [title, category, courseId] = values;
            if (!title || !category) {
              return null;
            }
            return {
              title,
              category,
              course_id: courseId ? Number(courseId) : undefined,
            };
          })
          .filter(Boolean) as CourseTopicPayload[];
        await withStatus(() => onImportTopics(topics), `Imported ${topics.length} course topics`);
      } else if (type === "students") {
        const payload: StudentPayload[] = payloadRows
          .map((values) => {
            const [name, email] = values;
            if (!name || !email) {
              return null;
            }
            return { name, email };
          })
          .filter(Boolean) as StudentPayload[];
        await withStatus(() => onImportStudents(payload), `Imported ${payload.length} students`);
      } else {
        const payload: SubmissionPayload[] = payloadRows
          .map((values) => {
            const [studentEmail, courseName, topicTitle, topicCategory, answerText, finalScore, examType] = values;
            if (!studentEmail || !courseName || !answerText) {
              return null;
            }
            return {
              student_email: studentEmail,
              course_name: courseName,
              topic_title: topicTitle || undefined,
              topic_category: topicCategory || undefined,
              answer_text: answerText,
              final_score: finalScore ? Number(finalScore) : undefined,
              exam_type: examType || undefined,
            };
          })
          .filter(Boolean) as SubmissionPayload[];
        await withStatus(() => onImportSubmissions(payload), `Imported ${payload.length} quiz submissions`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Failed to upload file.";
      setMessage({ text: detail, tone: "error" });
    } finally {
      event.target.value = "";
    }
  };

  const handleSampleImport = () => withStatus(onLoadSampleData, "Sample data loaded into the backend.");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-gray-900">Import Data</h2>
        <p className="mb-6 text-gray-600">
          Upload CSV files for course topics, students, and quiz submissions. Files are validated in the browser and then
          pushed to the FastAPI backend.
        </p>

        <button
          onClick={handleSampleImport}
          disabled={isProcessing}
          className="mb-8 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          <FileText className="h-5 w-5" />
          {isProcessing ? "Processing..." : "Load Sample Data"}
        </button>

        <div className="grid gap-6 md:grid-cols-3">
          <ImportCard
            label="Course Topics"
            helper="CSV: title, category, course_id(optional)"
            count={courseTopics.length}
            disabled={isProcessing || isLoading}
            onChange={(event) => handleFileUpload(event, "topics")}
          />
          <ImportCard
            label="Students"
            helper="CSV: name, email"
            count={students.length}
            disabled={isProcessing || isLoading}
            onChange={(event) => handleFileUpload(event, "students")}
          />
          <ImportCard
            label="Quiz Answers"
            helper="CSV: student_email, course_name, topic_title, topic_category, answer_text, final_score, exam_type"
            count={quizAnswers.length}
            disabled={isProcessing || isLoading}
            onChange={(event) => handleFileUpload(event, "answers")}
          />
        </div>

        {message && (
          <div
            className={`mt-6 flex items-center gap-2 rounded-lg border px-4 py-3 ${
              message.tone === "success"
                ? "border-blue-200 bg-blue-50 text-blue-900"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{message.text}</p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <h2 className="text-gray-900">Data Summary</h2>
          {isLoading && <span className="text-sm text-gray-500">Refreshing data from backend…</span>}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <SummaryCard label="Course Topics" value={courseTopics.length} />
          <SummaryCard label="Students" value={students.length} />
          <SummaryCard label="Quiz Submissions" value={quizAnswers.length} />
        </div>
      </div>
    </div>
  );
}

type ImportCardProps = {
  label: string;
  helper: string;
  count: number;
  disabled?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function ImportCard({ label, helper, count, disabled, onChange }: ImportCardProps) {
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-blue-400">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-gray-900">{label}</h3>
        {count > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <Check className="h-4 w-4" />
            {count}
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-gray-600">{helper}</p>
      <label className="block">
        <input type="file" accept=".csv" className="hidden" disabled={disabled} onChange={onChange} />
        <div className="cursor-pointer rounded-lg border border-gray-300 bg-gray-50 p-4 text-center transition-colors hover:bg-gray-100">
          <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <span className="text-gray-700">{disabled ? "Please wait…" : "Upload CSV"}</span>
        </div>
      </label>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
};

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="mb-1 text-gray-600">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
