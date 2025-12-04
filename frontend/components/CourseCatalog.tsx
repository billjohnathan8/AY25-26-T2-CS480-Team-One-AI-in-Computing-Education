import { CourseSummary } from "../lib/api";

interface Props {
  courses: CourseSummary[];
  onUploadClick?: (courseId: number) => void;
}

const CourseCatalog = ({ courses, onUploadClick }: Props) => {
  return (
    <section className="card catalog">
      <header>
        <h3>My Courses</h3>
        <p>Track AI usage per course and topic.</p>
      </header>
      <div className="catalog-grid">
        {courses.map((course) => (
          <article key={course.course_id} className="course-card">
            <header>
              <strong>{course.course_name}</strong>
              <span>Section {course.section_number ?? "N/A"}</span>
            </header>
            <p>
              {course.flagged_submissions} flagged / {course.total_submissions} submissions ·{" "}
              {Math.round(course.average_ai_probability * 100)}% avg AI
            </p>
            <ul>
              {course.top_topics.slice(0, 3).map((topic) => (
                <li key={`${course.course_id}-${topic.topic_id ?? topic.topic_title}`}>
                  {topic.topic_title ?? "General"} — {Math.round(topic.average_ai_probability * 100)}%
                </li>
              ))}
            </ul>
            {onUploadClick && (
              <button onClick={() => onUploadClick(course.course_id)} className="secondary">
                Upload submissions
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default CourseCatalog;
