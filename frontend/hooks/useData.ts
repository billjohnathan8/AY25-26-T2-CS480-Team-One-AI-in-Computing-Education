import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CourseTopic,
  CourseTopicPayload,
  Student,
  StudentPayload,
  Submission,
  SubmissionPayload,
  fetchCourseTopics,
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

export function useCourseTopicsQuery() {
  return useQuery<CourseTopic[]>({
    queryKey: COURSE_TOPICS_KEY,
    queryFn: fetchCourseTopics,
  });
}

export function useStudentsQuery() {
  return useQuery<Student[]>({
    queryKey: STUDENTS_KEY,
    queryFn: fetchStudents,
  });
}

export function useQuizAnswersQuery() {
  return useQuery<Submission[]>({
    queryKey: QUIZ_ANSWERS_KEY,
    queryFn: fetchSubmissions,
    refetchInterval: 60000,
  });
}

export function useImportMutations() {
  const queryClient = useQueryClient();

  const coursesMutation = useMutation({
    mutationFn: importCourses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_TOPICS_KEY });
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
