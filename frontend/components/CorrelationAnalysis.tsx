import { TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ZAxis } from "recharts";

import type { Student, CourseTopic, QuizAnswer } from "../app/App";

type CorrelationAnalysisProps = {
  students: Student[];
  courseTopics: CourseTopic[];
  quizAnswers: QuizAnswer[];
};

export function CorrelationAnalysis({ students, courseTopics, quizAnswers }: CorrelationAnalysisProps) {
  if (quizAnswers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-600">No data available. Please import data first.</p>
      </div>
    );
  }

  // Calculate correlation data for each student
  const studentCorrelationData = students.map((student) => {
    const studentAnswers = quizAnswers.filter((a) => a.studentId === student.id);
    const finalAnswers = studentAnswers.filter((a) => a.testType === 'final');

    const avgAI = studentAnswers.length > 0
      ? studentAnswers.reduce((sum, a) => sum + a.aiProbability, 0) / studentAnswers.length
      : 0;

    const avgFinalScore = finalAnswers.length > 0
      ? finalAnswers.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / finalAnswers.length
      : 0;

    return {
      name: student.name,
      aiUsage: Math.round(avgAI * 100),
      finalScore: Math.round(avgFinalScore),
      submissions: studentAnswers.length,
    };
  }).filter((d) => d.finalScore > 0);

  // Calculate correlation data by topic
  const topicCorrelationData = courseTopics.map((topic) => {
    const topicAnswers = quizAnswers.filter((a) => a.topicId === topic.id);
    const finalAnswers = topicAnswers.filter((a) => a.testType === 'final');

    const avgAI = topicAnswers.length > 0
      ? topicAnswers.reduce((sum, a) => sum + a.aiProbability, 0) / topicAnswers.length
      : 0;

    const avgFinalScore = finalAnswers.length > 0
      ? finalAnswers.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / finalAnswers.length
      : 0;

    return {
      name: topic.name,
      category: topic.category,
      aiUsage: Math.round(avgAI * 100),
      finalScore: Math.round(avgFinalScore),
      submissions: topicAnswers.length,
    };
  }).filter((d) => d.finalScore > 0);

  // Calculate correlation coefficient (simple Pearson correlation)
  const calculateCorrelation = (data: { aiUsage: number; finalScore: number }[]) => {
    if (data.length < 2) return 0;

    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.aiUsage, 0);
    const sumY = data.reduce((sum, d) => sum + d.finalScore, 0);
    const sumXY = data.reduce((sum, d) => sum + d.aiUsage * d.finalScore, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.aiUsage * d.aiUsage, 0);
    const sumY2 = data.reduce((sum, d) => sum + d.finalScore * d.finalScore, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  };

  const studentCorrelation = calculateCorrelation(studentCorrelationData);
  const topicCorrelation = calculateCorrelation(topicCorrelationData);

  // Find high-risk students (high AI, low scores)
  const highRiskStudents = studentCorrelationData
    .filter((d) => d.aiUsage >= 50 && d.finalScore < 70)
    .sort((a, b) => b.aiUsage - a.aiUsage);

  // Find low-risk students (low AI, high scores)
  const lowRiskStudents = studentCorrelationData
    .filter((d) => d.aiUsage < 30 && d.finalScore >= 80)
    .sort((a, b) => b.finalScore - a.finalScore);

  // Find concerning topics
  const concerningTopics = topicCorrelationData
    .filter((d) => d.aiUsage >= 50 && d.finalScore < 70)
    .sort((a, b) => b.aiUsage - a.aiUsage);

  return (
    <div className="space-y-6">
      {/* Correlation Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-4">Student-Level Correlation</h2>
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">AI Usage vs. Final Score</p>
            <div className="flex items-center gap-2">
              {studentCorrelation < -0.3 ? (
                <TrendingDown className="w-5 h-5 text-red-600" />
              ) : studentCorrelation > 0.3 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
              <span className={`${
                studentCorrelation < -0.3 ? 'text-red-600' : 
                studentCorrelation > 0.3 ? 'text-green-600' : 
                'text-gray-600'
              }`}>
                r = {studentCorrelation.toFixed(3)}
              </span>
            </div>
          </div>
          <p className="text-gray-600">
            {studentCorrelation < -0.3 
              ? 'Strong negative correlation: Higher AI usage is associated with lower final scores.'
              : studentCorrelation > 0.3
              ? 'Strong positive correlation: Higher AI usage is associated with higher final scores.'
              : 'Weak correlation: No clear relationship between AI usage and final scores.'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-4">Topic-Level Correlation</h2>
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">AI Usage vs. Final Score</p>
            <div className="flex items-center gap-2">
              {topicCorrelation < -0.3 ? (
                <TrendingDown className="w-5 h-5 text-red-600" />
              ) : topicCorrelation > 0.3 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-gray-400" />
              )}
              <span className={`${
                topicCorrelation < -0.3 ? 'text-red-600' : 
                topicCorrelation > 0.3 ? 'text-green-600' : 
                'text-gray-600'
              }`}>
                r = {topicCorrelation.toFixed(3)}
              </span>
            </div>
          </div>
          <p className="text-gray-600">
            {topicCorrelation < -0.3 
              ? 'Strong negative correlation: Topics with higher AI usage show lower final scores.'
              : topicCorrelation > 0.3
              ? 'Strong positive correlation: Topics with higher AI usage show higher final scores.'
              : 'Weak correlation: No clear relationship between topic AI usage and final scores.'}
          </p>
        </div>
      </div>

      {/* Scatter Plots */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-4">Student AI Usage vs Final Score</h2>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="aiUsage" 
                name="AI Usage" 
                unit="%" 
                label={{ value: 'AI Usage (%)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                type="number" 
                dataKey="finalScore" 
                name="Final Score" 
                unit="%" 
                label={{ value: 'Final Score (%)', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis type="number" dataKey="submissions" range={[50, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter 
                name="Students" 
                data={studentCorrelationData} 
                fill="#3b82f6" 
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-4">Topic AI Usage vs Final Score</h2>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="aiUsage" 
                name="AI Usage" 
                unit="%" 
                label={{ value: 'AI Usage (%)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                type="number" 
                dataKey="finalScore" 
                name="Final Score" 
                unit="%" 
                label={{ value: 'Final Score (%)', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis type="number" dataKey="submissions" range={[50, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter 
                name="Topics" 
                data={topicCorrelationData} 
                fill="#8b5cf6" 
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* High Risk Students */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <h2 className="text-gray-900">High-Risk Students</h2>
          </div>
          <p className="text-gray-600 mb-4">
            High AI usage (&gt;50%) with low final scores (&lt;70%)
          </p>
          {highRiskStudents.length > 0 ? (
            <div className="space-y-2">
              {highRiskStudents.slice(0, 5).map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-gray-900">{student.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-red-600">AI: {student.aiUsage}%</span>
                    <span className="text-gray-900">Score: {student.finalScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No high-risk students identified.</p>
          )}
        </div>

        {/* Low Risk Students */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-gray-900">Exemplary Students</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Low AI usage (&lt;30%) with high final scores (&gt;80%)
          </p>
          {lowRiskStudents.length > 0 ? (
            <div className="space-y-2">
              {lowRiskStudents.slice(0, 5).map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-gray-900">{student.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-green-600">AI: {student.aiUsage}%</span>
                    <span className="text-gray-900">Score: {student.finalScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No exemplary students identified.</p>
          )}
        </div>
      </div>

      {/* Concerning Topics */}
      {concerningTopics.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h2 className="text-gray-900">Topics Requiring Attention</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Topics with high AI usage (&gt;50%) and low final scores (&lt;70%)
          </p>
          <div className="space-y-2">
            {concerningTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <span className="text-gray-900">{topic.name}</span>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {topic.category}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-orange-600">AI: {topic.aiUsage}%</span>
                  <span className="text-gray-900">Score: {topic.finalScore}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
