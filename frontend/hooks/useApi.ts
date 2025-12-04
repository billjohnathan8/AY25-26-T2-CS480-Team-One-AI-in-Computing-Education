import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AnalyticsOverview,
  CourseSummary,
  Submission,
  fetchAnalytics,
  fetchCourseSummaries,
  fetchSubmissions,
  importCourses,
  importStudents,
  importSubmissions,
  importTopics,
  uploadCoursesFile,
  uploadStudentsFile,
  uploadSubmissionsFile
} from "../lib/api";

export function useAnalytics() {
  return useQuery<AnalyticsOverview>({
    queryKey: ["analytics-overview"],
    queryFn: fetchAnalytics,
    refetchInterval: 120000
  });
}

export function useSubmissions() {
  return useQuery<Submission[]>({
    queryKey: ["submissions"],
    queryFn: fetchSubmissions,
    refetchInterval: 60000
  });
}

export function useCourseSummaries(userId?: number) {
  return useQuery<CourseSummary[]>({
    queryKey: ["courses", userId],
    queryFn: () => fetchCourseSummaries(userId),
    enabled: Boolean(userId)
  });

export function useImportActions() {
  const queryClient = useQueryClient();

  const coursesMutation = useMutation({
    mutationFn: importCourses,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analytics-overview"] })
  });
  const topicsMutation = useMutation({
    mutationFn: importTopics,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analytics-overview"] })
  });
  const studentsMutation = useMutation({
    mutationFn: importStudents,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analytics-overview"] })
  });
  const submissionsMutation = useMutation({
    mutationFn: importSubmissions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    }
  });

  return { coursesMutation, topicsMutation, studentsMutation, submissionsMutation };
}

export function useUploadActions() {
  const queryClient = useQueryClient();
  const uploadCourses = useMutation({
    mutationFn: uploadCoursesFile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] })
  });
  const uploadStudents = useMutation({
    mutationFn: uploadStudentsFile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analytics-overview"] })
  });
  const uploadSubmissions = useMutation({
    mutationFn: ({ file, courseId, studentEmail }: { file: File; courseId?: number; studentEmail?: string }) =>
      uploadSubmissionsFile(file, courseId, studentEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    }
  });
  return { uploadCourses, uploadStudents, uploadSubmissions };
}
