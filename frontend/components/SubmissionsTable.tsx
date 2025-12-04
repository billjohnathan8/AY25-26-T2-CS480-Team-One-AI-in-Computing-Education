import { Submission } from "../lib/api";

interface Props {
  submissions?: Submission[];
}

const SubmissionsTable = ({ submissions }: Props) => {
  if (!submissions) {
    return (
      <section className="card">
        <h3>Submissions</h3>
        <p>Loading submissions...</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h3>Latest Quiz Imports</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Topic</th>
              <th>AI Probability</th>
              <th>Score</th>
              <th>Exam</th>
              <th>File</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className={submission.flagged ? "flagged" : ""}>
                <td>
                  <strong>{submission.student_name ?? `Student #${submission.student_id}`}</strong>
                  <span>{submission.student_email}</span>
                </td>
                <td>{submission.course_name ?? `Course #${submission.course_id}`}</td>
                <td>{submission.topic_title ?? "n/a"}</td>
                <td>{Math.round(submission.ai_probability * 100)}%</td>
                <td>{submission.raw_score ?? "-"}</td>
                <td>{submission.exam_type ?? "closed"}</td>
                <td>{submission.source_filename ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SubmissionsTable;
