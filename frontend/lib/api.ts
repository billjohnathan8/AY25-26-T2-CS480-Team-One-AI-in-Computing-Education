import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export interface AuthResponse {
  token: string;
  user_id: number;
}

export interface SignupPayload {
  email: string;
  password: string;
  name?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CourseCreatePayload {
  name: string;
  section_number?: number | null;
  description?: string | null;
  content_manifest?: string | null;
}

export interface CourseRead extends CourseCreatePayload {
  id: number;
}

export interface CourseTopicPayload {
  title: string;
  category: string;
  course_id?: number | null;
}

export interface CourseTopic extends CourseTopicPayload {
  id: number;
}

export interface StudentPayload {
  name: string;
  email: string;
}

export interface Student extends StudentPayload {
  id: number;
}

export interface SubmissionPayload {
  student_id?: number;
  student_email?: string;
  course_id?: number;
  course_name?: string;
  topic_id?: number;
  topic_title?: string;
  topic_category?: string;
  answer_text: string;
  raw_score?: number;
  final_score?: number;
  exam_type?: string;
  source_filename?: string;
  source_path?: string;
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
  topic_category?: string | null;
}

export async function fetchCourseTopics(): Promise<CourseTopic[]> {
  const { data } = await apiClient.get<CourseTopic[]>("/courses/topics");
  return data;
}

export async function fetchCourses(userId?: number): Promise<CourseRead[]> {
  const params = userId ? { user_id: userId } : undefined;
  const { data } = await apiClient.get<CourseRead[]>("/courses", { params });
  return data;
}

export async function fetchStudents(): Promise<Student[]> {
  const { data } = await apiClient.get<Student[]>("/students");
  return data;
}

export async function fetchSubmissions(): Promise<Submission[]> {
  const { data } = await apiClient.get<Submission[]>("/submissions");
  return data;
}

export async function importCourses(payload: CourseCreatePayload[]): Promise<CourseRead[]> {
  const { data } = await apiClient.post<CourseRead[]>("/courses/import", payload);
  return data;
}

export async function importTopics(payload: CourseTopicPayload[]): Promise<CourseTopic[]> {
  const { data } = await apiClient.post<CourseTopic[]>("/courses/topics/import", payload);
  return data;
}

export async function assignCourseToUser(courseId: number, userId: number): Promise<void> {
  await apiClient.post(`/courses/${courseId}/assign/${userId}`);
}

export async function importStudents(payload: StudentPayload[]): Promise<Student[]> {
  const { data } = await apiClient.post<Student[]>("/students/import", payload);
  return data;
}

export async function importSubmissions(payload: SubmissionPayload[]): Promise<Submission[]> {
  const { data } = await apiClient.post<Submission[]>("/submissions/import", payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/signup", payload);
  return data;
}
