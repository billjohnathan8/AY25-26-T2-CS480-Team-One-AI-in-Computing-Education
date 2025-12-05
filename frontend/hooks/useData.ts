import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CourseRead,
  CourseTopic,
  CourseTopicPayload,
  Student,
  StudentPayload,
  Submission,
  SubmissionPayload,
  fetchCourseTopics,
  fetchCourses,
  fetchStudents,
  fetchSubmissions,
  importCourses,
  importStudents,
  importSubmissions,
  importTopics,
} from "../lib/api";

const COURSE_TOPICS_KEY = ["course-topics"];
const STUDENTS_KEY = ["students"];
const QUIZ_ANSWERS_KEY = ["quiz-answers"];
const COURSES_KEY = ["courses"];

export function useCourseTopicsQuery(enabled = true) {
  return useQuery<CourseTopic[]>({
    queryKey: COURSE_TOPICS_KEY,
    queryFn: fetchCourseTopics,
    enabled,
  });
}

export function useStudentsQuery(enabled = true) {
  return useQuery<Student[]>({
    queryKey: STUDENTS_KEY,
    queryFn: fetchStudents,
    enabled,
  });
}

export function useQuizAnswersQuery(enabled = true) {
  return useQuery<Submission[]>({
    queryKey: QUIZ_ANSWERS_KEY,
    queryFn: fetchSubmissions,
    enabled,
    refetchInterval: 60000,
  });
}

export function useInstructorCoursesQuery(userId?: number, enabled = true) {
  return useQuery<CourseRead[]>({
    queryKey: [...COURSES_KEY, userId ?? "all"],
    queryFn: () => fetchCourses(userId),
    enabled: enabled && Boolean(userId),
  });
}

export function useImportMutations() {
  const queryClient = useQueryClient();

  const coursesMutation = useMutation({
    mutationFn: importCourses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_KEY });
    },
  });

  const topicsMutation = useMutation({
    mutationFn: importTopics,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_TOPICS_KEY });
    },
  });

  const studentsMutation = useMutation({
    mutationFn: importStudents,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_KEY });
    },
  });

  const submissionsMutation = useMutation({
    mutationFn: importSubmissions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_TOPICS_KEY });
      queryClient.invalidateQueries({ queryKey: STUDENTS_KEY });
      queryClient.invalidateQueries({ queryKey: QUIZ_ANSWERS_KEY });
    },
  });

  return {
    coursesMutation,
    topicsMutation,
    studentsMutation,
    submissionsMutation,
  };
}
