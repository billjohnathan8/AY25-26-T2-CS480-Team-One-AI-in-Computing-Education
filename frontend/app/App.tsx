import { useState } from "react";
import AnalyticsSummary from "../components/AnalyticsSummary";
import CourseCatalog from "../components/CourseCatalog";
import FileUploadCard from "../components/FileUploadCard";
import ImportCard from "../components/ImportCard";
import LoginPanel from "../components/LoginPanel";
import SubmissionsTable from "../components/SubmissionsTable";
import { useAuth } from "../hooks/useAuth";
import { useAnalytics, useCourseSummaries, useImportActions, useSubmissions, useUploadActions } from "../hooks/useApi";

const courseSample = JSON.stringify(
  [
    { name: "Software Quality", section_number: 1, description: "Testing & QA" },
    { name: "Secure Coding", section_number: 2, description: "Security topics" }
  ],
  null,
  2
);

const topicSample = JSON.stringify(
  [
    { title: "Process", category: "Process", course_id: 1 },
    { title: "Automation", category: "Automation", course_id: 1 }
  ],
  null,
  2
);

const studentSample = `name,email
Alice Johnson,alice@example.com
Bob Stone,bob@example.com`;

const submissionSample = JSON.stringify(
  [
    {
      student_email: "alice@example.com",
      course_name: "Software Quality",
      topic_title: "Testing",
      topic_category: "Testing",
      answer_text: "I focused on regression testing and coverage improvements.",
      raw_score: 85,
      final_score: 90
    }
  ],
  null,
  2
);

const App = () => {
  const { token, userId, logout } = useAuth();
  const { data: analytics } = useAnalytics();
  const { data: submissions } = useSubmissions();
  const { data: courseSummaries } = useCourseSummaries(userId);
  const { coursesMutation, topicsMutation, studentsMutation, submissionsMutation } = useImportActions();
  const { uploadCourses, uploadStudents, uploadSubmissions } = useUploadActions();
  const [pendingCourse, setPendingCourse] = useState<number | undefined>(undefined);
  const flaggedTotal = analytics
    ? analytics.student_risks.slice(0, 50).reduce((acc, risk) => acc + risk.flagged_submissions, 0)
    : 0;

  if (!token) {
    return (
      <main className="layout">
        <LoginPanel />
      </main>
    );
  }

  return (
    <main className="layout">
      <header className="hero">
        <div>
          <h1>Course Integrity Monitor</h1>
          <p>
            Import course rosters, quiz submissions, and AI detection telemetry to monitor suspicious activity and
            correlate it with student outcomes.
          </p>
        </div>
        <div className="stat">
          <span>Flagged submissions</span>
          <strong>{flaggedTotal}</strong>
        </div>
        <button className="secondary" onClick={logout}>
          Logout
        </button>
      </header>

      {courseSummaries && (
        <CourseCatalog courses={courseSummaries} onUploadClick={(courseId) => setPendingCourse(courseId)} />
      )}

      <section className="cards-grid">
        <ImportCard
          title="Import Courses"
          description="Paste JSON or CSV to add or update course shells."
          sample={courseSample}
          onImport={(payload) => coursesMutation.mutateAsync(payload)}
        />
        <ImportCard
          title="Import Topics"
          description="Associate topics like process, automation, and code review with courses."
          sample={topicSample}
          onImport={(payload) => topicsMutation.mutateAsync(payload)}
        />
        <ImportCard
          title="Import Students"
          description="Upload rosters with id, name, and email."
          sample={studentSample}
          onImport={(payload) => studentsMutation.mutateAsync(payload)}
        />
        <ImportCard
          title="Import Quiz Answers"
          description="Send quiz answers to the AI pipeline and flag high-risk responses."
          sample={submissionSample}
          onImport={(payload) => submissionsMutation.mutateAsync(payload)}
        />
        <FileUploadCard
          title="Upload Courses (CSV/XLSX)"
          description="Bulk import courses and rich content files."
          accept=".csv,.xlsx"
          onUpload={(file) => uploadCourses.mutateAsync(file)}
        />
        <FileUploadCard
          title="Upload Student Rosters"
          description="Use registrar exports to sync rosters quickly."
          accept=".csv,.xlsx"
          onUpload={(file) => uploadStudents.mutateAsync(file)}
        />
        <FileUploadCard
          title={`Upload Quiz Files ${pendingCourse ? `(Course ${pendingCourse})` : ""}`}
          description="Drop PDFs or spreadsheets of quiz answers for OCR + detection."
          accept=".csv,.xlsx,.pdf"
          onUpload={(file) => uploadSubmissions.mutateAsync({ file, courseId: pendingCourse })}
        />
      </section>

      <AnalyticsSummary data={analytics} />
      <SubmissionsTable submissions={submissions} />
    </main>
  );
};

export default App;
