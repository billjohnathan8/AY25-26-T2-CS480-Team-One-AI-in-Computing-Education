import { AnalyticsOverview } from "../lib/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

interface Props {
  data?: AnalyticsOverview;
}

const AnalyticsSummary = ({ data }: Props) => {
  if (!data) {
    return (
      <section className="card">
        <h3>Analytics Summary</h3>
        <p>Loading analytics...</p>
      </section>
    );
  }

  const chartData = data.most_risky_courses.map((topic) => ({
    name: topic.topic_title ?? topic.course_name,
    ai: Math.round(topic.average_ai_probability * 100),
    flags: topic.flagged_count
  }));

  return (
    <section className="card analytics">
      <header className="card-header">
        <div>
          <h3>Analytics Summary</h3>
          <p>Updated {new Date(data.generated_at).toLocaleString()}</p>
        </div>
      </header>
      <div className="chart">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="ai" fill="#6366f1" name="Avg AI %" />
            <Bar dataKey="flags" fill="#f97316" name="# Flags" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-two">
        <div>
          <h4>Top Topics</h4>
          <ul>
            {data.most_risky_courses.slice(0, 5).map((topic) => (
              <li key={`${topic.course_id}-${topic.topic_id ?? "na"}`}>
                <span>{topic.topic_title ?? topic.course_name}</span>
                <strong>{Math.round(topic.average_ai_probability * 100)}%</strong>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Students Triggering Flags</h4>
          <ul>
            {data.student_risks.slice(0, 5).map((student) => (
              <li key={student.student_id}>
                <span>{student.student_name}</span>
                <strong>
                  {student.flagged_submissions} flags · {Math.round(student.average_ai_probability * 100)}%
                </strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsSummary;
