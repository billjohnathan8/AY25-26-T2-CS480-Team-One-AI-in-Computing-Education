import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

export interface Course {
  id: number;
  name: string;
  section_number?: number;
  description?: string;
  content_manifest?: string | null;
}

export interface Student {
  id: number;
  name: string;
  email: string;
}

export interface Submission {
  id: number;
  student_id: number;
  course_id: number;
  topic_id?: number | null;
  answer_text: string;
  ai_probability: number;
  flagged: boolean;
  raw_score?: number | null;
  final_score?: number | null;
  exam_type?: string | null;
  submitted_at: string;
  student_name?: string | null;
  student_email?: string | null;
  course_name?: string | null;
  topic_title?: string | null;
}

export interface AnalyticsByTopic {
  course_id: number;
  course_name: string;
  topic_id?: number | null;
  topic_title?: string | null;
  average_ai_probability: number;
  flagged_count: number;
  submission_count: number;
}

export interface StudentRisk {
  student_id: number;
  student_name: string;
  student_email: string;
  flagged_submissions: number;
  average_ai_probability: number;
  latest_final_score?: number | null;
}

export interface AnalyticsOverview {
  generated_at: string;
  most_risky_courses: AnalyticsByTopic[];
  student_risks: StudentRisk[];
}

export interface CourseSummary {
  course_id: number;
  course_name: string;
  section_number?: number | null;
  total_submissions: number;
  flagged_submissions: number;
  average_ai_probability: number;
  top_topics: AnalyticsByTopic[];
}

export interface AuthResponse {
  token: string;
  user_id: number;
}

export async function fetchAnalytics(): Promise<AnalyticsOverview> {
  const { data } = await apiClient.get<AnalyticsOverview>("/analytics/overview");
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/signup", { name, email, password });
  return data;
}

export async function fetchSubmissions(): Promise<Submission[]> {
  const { data } = await apiClient.get<Submission[]>("/submissions");
  return data;
}

export async function importCourses(payload: unknown): Promise<Course[]> {
  const { data } = await apiClient.post<Course[]>("/courses/import", payload);
  return data;
}

export async function importTopics(payload: unknown) {
  const { data } = await apiClient.post("/courses/topics/import", payload);
  return data;
}

export async function importStudents(payload: unknown): Promise<Student[]> {
  const { data } = await apiClient.post<Student[]>("/students/import", payload);
  return data;
}

export async function importSubmissions(payload: unknown): Promise<Submission[]> {
  const { data } = await apiClient.post<Submission[]>("/submissions/import", payload);
  return data;
}

export async function uploadCoursesFile(file: File): Promise<Course[]> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await apiClient.post<Course[]>("/import-file/courses", body, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

export async function uploadStudentsFile(file: File): Promise<Student[]> {
  const body = new FormData();
  body.append("file", file);
  const { data } = await apiClient.post<Student[]>("/import-file/students", body, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

export async function uploadSubmissionsFile(file: File, courseId?: number, studentEmail?: string) {
  const body = new FormData();
  body.append("file", file);
  const params = new URLSearchParams();
  if (courseId) params.append("course_id", String(courseId));
  if (studentEmail) params.append("student_email", studentEmail);
  const { data } = await apiClient.post<Submission[]>(
    `/import-file/submissions?${params.toString()}`,
    body,
    {
      headers: { "Content-Type": "multipart/form-data" }
    }
  );
  return data;
}

export async function fetchCourseSummaries(userId?: number): Promise<CourseSummary[]> {
  const { data } = await apiClient.get<CourseSummary[]>(`/courses`, { params: { user_id: userId } });
  const summaries = await Promise.all(
    data.map(async (course) => {
      const summaryResponse = await apiClient.get<CourseSummary>(`/courses/${course.id}/summary`);
      return summaryResponse.data;
    })
  );
  return summaries;
}
