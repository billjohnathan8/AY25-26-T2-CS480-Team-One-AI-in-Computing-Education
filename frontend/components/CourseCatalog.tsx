import { useMemo } from "react";

import type { CourseRead } from "../lib/api";

type CourseCatalogProps = {
  courses: CourseRead[];
  isLoading: boolean;
  error: Error | null;
  onSelectCourse: (course: CourseRead) => void;
  onRefresh: () => void;
  onLogout: () => void;
  onLoadSampleData?: () => void;
  isSampleLoading?: boolean;
  userName?: string | null;
  userEmail?: string | null;
};

export function CourseCatalog({
  courses,
  isLoading,
  error,
  onSelectCourse,
  onRefresh,
  onLogout,
  onLoadSampleData,
  isSampleLoading,
  userName,
  userEmail,
}: CourseCatalogProps) {
  const sortedCourses = useMemo(() => [...courses].sort((a, b) => a.name.localeCompare(b.name)), [courses]);
  const heroSubtitle = userName || userEmail || "Instructor";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">Course Integrity</p>
            <h1 className="text-2xl font-semibold text-gray-900">AI Detection Studio</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="text-sm font-semibold text-gray-900">{userEmail ?? "-"}</p>
            </div>
            <button
              onClick={onLogout}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-widest text-gray-500">Welcome back, {heroSubtitle}</p>
                <h2 className="text-4xl font-semibold text-gray-900">Select a course to review AI usage insights.</h2>
                <p className="text-lg text-gray-600 max-w-2xl">
                  Launch straight into exam submissions, flagged activity, and content analytics for each course you are
                  assigned to teach. Each card represents a catalog entry - pick one to continue.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onRefresh}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Refresh
                </button>
                {onLoadSampleData && (
                  <button
                    onClick={onLoadSampleData}
                    disabled={isSampleLoading}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                  >
                    {isSampleLoading ? "Loading..." : "Load sample data"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm uppercase tracking-widest text-gray-500">Courses</p>
              <h3 className="text-2xl font-semibold text-gray-900">By Section</h3>
            </div>
            <span className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
              {sortedCourses.length} {sortedCourses.length === 1 ? "course" : "courses"}
            </span>
          </div>

          {isLoading && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">Loading courses...</div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
              {error.message ?? "Unable to load courses for this user."}
            </div>
          )}

          {!isLoading && !error && sortedCourses.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
              <p className="text-lg font-semibold text-gray-900">No assigned courses yet</p>
              <p className="mt-2 text-gray-600">
                Import registrar data or use the sample dataset to scaffold your catalog.
              </p>
              {onLoadSampleData && (
                <button
                  onClick={onLoadSampleData}
                  disabled={isSampleLoading}
                  className="mt-6 rounded-lg bg-gray-900 px-6 py-3 text-white font-semibold hover:bg-black disabled:opacity-60"
                >
                  {isSampleLoading ? "Seeding catalog..." : "Generate sample catalog"}
                </button>
              )}
            </div>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedCourses.map((course) => (
              <div key={course.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-500">Section {course.section_number ?? "-"}</div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    Catalog ID #{course.id}
                  </span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900">{course.name}</h4>
                <p className="mt-2 text-sm text-gray-600 min-h-[60px]">
                  {course.description ?? "A newly added course is ready for AI detection insights."}
                </p>
                <button
                  onClick={() => onSelectCourse(course)}
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                >
                  View analytics
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
