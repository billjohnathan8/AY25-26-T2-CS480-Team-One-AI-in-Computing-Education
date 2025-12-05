import { useMemo, useState } from "react";
import { BarChart3, BookOpen, TrendingUp, Upload, Users } from "lucide-react";

import { CourseAnalytics } from "../components/CourseAnalytics";
import { CorrelationAnalysis } from "../components/CorrelationAnalysis";
import { Dashboard } from "../components/Dashboard";
import { DataImport } from "../components/DataImport";
import { StudentAnalytics } from "../components/StudentAnalytics";
import { useCourseTopicsQuery, useImportMutations, useQuizAnswersQuery, useStudentsQuery } from "../hooks/useData";
import type { CourseTopic as BackendTopic, CourseTopicPayload, Student as BackendStudent, StudentPayload, Submission, SubmissionPayload } from "../lib/api";

export type CourseTopic = {
  id: number;
  name: string;
  category: string;
  courseId?: number | null;
};

export type Student = {
  id: number;
  name: string;
  email: string;
};

export type QuizAnswer = {
  id: number;
  studentId: number;
  studentName?: string;
  studentEmail?: string;
  courseId: number;
  courseName?: string;
  topicId?: number | null;
  topicName?: string | null;
  topicCategory?: string | null;
  answer: string;
  aiProbability: number;
  testType: "quiz" | "midterm" | "final";
  score: number;
  maxScore: number;
  flagged: boolean;
  submittedAt: string;
};

type TabType = "import" | "dashboard" | "courses" | "students" | "correlations";

const SAMPLE_COURSES = [
  { name: "Software Quality", section_number: 1, description: "Testing & QA focus" },
  { name: "Secure Coding", section_number: 1, description: "Threat modeling and secure SDLC" },
  { name: "Automation Engineering", section_number: 1, description: "CI/CD and DevOps practices" },
];

const SAMPLE_TOPICS = [
  { title: "Process Management", category: "Process", courseName: "Software Quality" },
  { title: "Security Fundamentals", category: "Security", courseName: "Secure Coding" },
  { title: "Unit Testing", category: "Testing", courseName: "Software Quality" },
  { title: "Code Review Best Practices", category: "Code Review", courseName: "Software Quality" },
  { title: "Refactoring Patterns", category: "Refactoring", courseName: "Software Quality" },
  { title: "CI/CD Automation", category: "Automation", courseName: "Automation Engineering" },
  { title: "Authentication & Authorization", category: "Security", courseName: "Secure Coding" },
  { title: "Integration Testing", category: "Testing", courseName: "Automation Engineering" },
];

const SAMPLE_STUDENTS = [
  { name: "Alice Johnson", email: "alice.j@university.edu" },
  { name: "Bob Smith", email: "bob.s@university.edu" },
  { name: "Carol White", email: "carol.w@university.edu" },
  { name: "David Brown", email: "david.b@university.edu" },
  { name: "Emma Davis", email: "emma.d@university.edu" },
  { name: "Frank Miller", email: "frank.m@university.edu" },
  { name: "Grace Wilson", email: "grace.w@university.edu" },
  { name: "Henry Martinez", email: "henry.m@university.edu" },
];

const SAMPLE_SUBMISSIONS = [
  {
    studentEmail: "alice.j@university.edu",
    courseName: "Software Quality",
    topicTitle: "Process Management",
    topicCategory: "Process",
    examType: "quiz",
    finalScore: 92,
    answer:
      "I focused on regression testing and coverage improvements leveraging CI/CD gates.",
  },
  {
    studentEmail: "bob.s@university.edu",
    courseName: "Secure Coding",
    topicTitle: "Authentication & Authorization",
    topicCategory: "Security",
    examType: "midterm",
    finalScore: 68,
    answer: "JWT handling and token invalidation were implemented with rotating secrets.",
  },
  {
    studentEmail: "carol.w@university.edu",
    courseName: "Automation Engineering",
    topicTitle: "Integration Testing",
    topicCategory: "Testing",
    examType: "final",
    finalScore: 74,
    answer: "Service tests run nightly with contract verification using Pact.",
  },
  {
    studentEmail: "david.b@university.edu",
    courseName: "Software Quality",
    topicTitle: "Code Review Best Practices",
    topicCategory: "Code Review",
    examType: "quiz",
    finalScore: 81,
    answer: "Checklists focus on risky modules and recent regressions.",
  },
];

const toCourseTopic = (topic: BackendTopic): CourseTopic => ({
  id: topic.id,
  name: topic.title,
  category: topic.category,
  courseId: topic.course_id,
});

const toStudent = (student: BackendStudent): Student => ({
  id: student.id,
  name: student.name,
  email: student.email,
});

const normalizeExamType = (examType?: string | null): QuizAnswer["testType"] => {
  if (!examType) return "quiz";
  const normalized = examType.toLowerCase();
  if (normalized.includes("mid")) return "midterm";
  if (normalized.includes("final")) return "final";
  return "quiz";
};

const toQuizAnswer = (submission: Submission): QuizAnswer => ({
  id: submission.id,
  studentId: submission.student_id,
  studentName: submission.student_name ?? undefined,
  studentEmail: submission.student_email ?? undefined,
  courseId: submission.course_id,
  courseName: submission.course_name ?? undefined,
  topicId: submission.topic_id ?? undefined,
  topicName: submission.topic_title ?? undefined,
  topicCategory: submission.topic_category ?? undefined,
  answer: submission.answer_text,
  aiProbability: submission.ai_probability,
  testType: normalizeExamType(submission.exam_type),
  score: submission.final_score ?? submission.raw_score ?? 0,
  maxScore: 100,
  flagged: submission.flagged,
  submittedAt: submission.submitted_at,
});

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("import");
  const topicsQuery = useCourseTopicsQuery();
  const studentsQuery = useStudentsQuery();
  const quizQuery = useQuizAnswersQuery();
  const { coursesMutation, topicsMutation, studentsMutation, submissionsMutation } = useImportMutations();

  const courseTopics = useMemo(() => (topicsQuery.data ?? []).map(toCourseTopic), [topicsQuery.data]);
  const students = useMemo(() => (studentsQuery.data ?? []).map(toStudent), [studentsQuery.data]);
  const quizAnswers = useMemo(() => (quizQuery.data ?? []).map(toQuizAnswer), [quizQuery.data]);

  const isLoading = topicsQuery.isLoading || studentsQuery.isLoading || quizQuery.isLoading;
  const loadError = topicsQuery.error || studentsQuery.error || quizQuery.error;

  const handleSampleDataImport = async () => {
    const createdCourses = await coursesMutation.mutateAsync(SAMPLE_COURSES);
    const courseLookup = new Map(createdCourses.map((course) => [course.name, course.id]));

    const topicPayload: CourseTopicPayload[] = SAMPLE_TOPICS.map((topic) => ({
      title: topic.title,
      category: topic.category,
      course_id: courseLookup.get(topic.courseName),
    }));
    await topicsMutation.mutateAsync(topicPayload);
    await studentsMutation.mutateAsync(SAMPLE_STUDENTS);
    const submissionPayload: SubmissionPayload[] = SAMPLE_SUBMISSIONS.map((entry) => ({
      student_email: entry.studentEmail,
      course_name: entry.courseName,
      topic_title: entry.topicTitle,
      topic_category: entry.topicCategory,
      answer_text: entry.answer,
      final_score: entry.finalScore,
      exam_type: entry.examType,
    }));
    await submissionsMutation.mutateAsync(submissionPayload);
  };

  const isMutating =
    coursesMutation.isPending ||
    topicsMutation.isPending ||
    studentsMutation.isPending ||
    submissionsMutation.isPending;

  const tabs = [
    { id: "import" as TabType, label: "Import Data", icon: Upload },
    { id: "dashboard" as TabType, label: "Dashboard", icon: BarChart3 },
    { id: "courses" as TabType, label: "Course Analytics", icon: BookOpen },
    { id: "students" as TabType, label: "Student Analytics", icon: Users },
    { id: "correlations" as TabType, label: "Correlation Analysis", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-gray-900">AI Detection Analytics</h1>
          <p className="text-gray-600">Import registrar data, sync AI detections, and explore the risk dashboards.</p>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loadError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {(loadError as Error)?.message ?? "Failed to load dashboard data from the backend."}
          </div>
        )}
        {activeTab === "import" && (
          <DataImport
            courseTopics={courseTopics}
            students={students}
            quizAnswers={quizAnswers}
            onImportTopics={(payload: CourseTopicPayload[]) => topicsMutation.mutateAsync(payload)}
            onImportStudents={(payload: StudentPayload[]) => studentsMutation.mutateAsync(payload)}
            onImportSubmissions={(payload: SubmissionPayload[]) => submissionsMutation.mutateAsync(payload)}
            onLoadSampleData={handleSampleDataImport}
            isLoading={isLoading}
            isProcessing={isMutating}
          />
        )}
        {activeTab === "dashboard" && <Dashboard courseTopics={courseTopics} students={students} quizAnswers={quizAnswers} />}
        {activeTab === "courses" && <CourseAnalytics courseTopics={courseTopics} quizAnswers={quizAnswers} />}
        {activeTab === "students" && (
          <StudentAnalytics students={students} courseTopics={courseTopics} quizAnswers={quizAnswers} />
        )}
        {activeTab === "correlations" && (
          <CorrelationAnalysis students={students} courseTopics={courseTopics} quizAnswers={quizAnswers} />
        )}
      </main>
    </div>
  );
}
