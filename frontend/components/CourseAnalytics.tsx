import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

import type { CourseTopic, QuizAnswer } from "../app/App";

type CourseAnalyticsProps = {
  courseTopics: CourseTopic[];
  quizAnswers: QuizAnswer[];
};

export function CourseAnalytics({ courseTopics, quizAnswers }: CourseAnalyticsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (quizAnswers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-600">No quiz data available. Please import data first.</p>
      </div>
    );
  }

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(courseTopics.map((t) => t.category)))];

  // Filter topics by category
  const filteredTopics = selectedCategory === 'all'
    ? courseTopics
    : courseTopics.filter((t) => t.category === selectedCategory);

  // Calculate detailed stats for each topic
  const topicDetails = filteredTopics.map((topic) => {
    const topicAnswers = quizAnswers.filter((a) => a.topicId === topic.id);
    const quizAnswers_filtered = topicAnswers.filter((a) => a.testType === 'quiz');
    const midtermAnswers = topicAnswers.filter((a) => a.testType === 'midterm');
    const finalAnswers = topicAnswers.filter((a) => a.testType === 'final');

    const avgAI = topicAnswers.length > 0
      ? topicAnswers.reduce((sum, a) => sum + a.aiProbability, 0) / topicAnswers.length
      : 0;

    const highAICount = topicAnswers.filter((a) => a.aiProbability >= 0.5).length;

    return {
      topic,
      totalSubmissions: topicAnswers.length,
      avgAIProbability: avgAI,
      highAICount,
      quizAvgAI: quizAnswers_filtered.length > 0 
        ? quizAnswers_filtered.reduce((sum, a) => sum + a.aiProbability, 0) / quizAnswers_filtered.length 
        : 0,
      midtermAvgAI: midtermAnswers.length > 0 
        ? midtermAnswers.reduce((sum, a) => sum + a.aiProbability, 0) / midtermAnswers.length 
        : 0,
      finalAvgAI: finalAnswers.length > 0 
        ? finalAnswers.reduce((sum, a) => sum + a.aiProbability, 0) / finalAnswers.length 
        : 0,
    };
  }).sort((a, b) => b.avgAIProbability - a.avgAIProbability);

  // Trend data across test types
  const trendData = filteredTopics.map((topic) => {
    const topicAnswers = quizAnswers.filter((a) => a.topicId === topic.id);
    const quizAnswers_filtered = topicAnswers.filter((a) => a.testType === 'quiz');
    const midtermAnswers = topicAnswers.filter((a) => a.testType === 'midterm');
    const finalAnswers = topicAnswers.filter((a) => a.testType === 'final');

    return {
      name: topic.name.length > 20 ? topic.name.substring(0, 20) + '...' : topic.name,
      Quiz: quizAnswers_filtered.length > 0 
        ? Math.round((quizAnswers_filtered.reduce((sum, a) => sum + a.aiProbability, 0) / quizAnswers_filtered.length) * 100) 
        : 0,
      Midterm: midtermAnswers.length > 0 
        ? Math.round((midtermAnswers.reduce((sum, a) => sum + a.aiProbability, 0) / midtermAnswers.length) * 100) 
        : 0,
      Final: finalAnswers.length > 0 
        ? Math.round((finalAnswers.reduce((sum, a) => sum + a.aiProbability, 0) / finalAnswers.length) * 100) 
        : 0,
    };
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-900">Course Topic Analysis</h2>
          <div className="flex items-center gap-2">
            <label className="text-gray-700">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* AI Usage Trend Across Test Types */}
        <div className="mb-8">
          <h3 className="text-gray-900 mb-4">AI Usage Trend by Test Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: 'AI Usage (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Quiz" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="Midterm" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" dataKey="Final" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Topic Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">Topic</th>
                <th className="text-left py-3 px-4 text-gray-700">Category</th>
                <th className="text-center py-3 px-4 text-gray-700">Submissions</th>
                <th className="text-center py-3 px-4 text-gray-700">Avg AI %</th>
                <th className="text-center py-3 px-4 text-gray-700">High AI Count</th>
                <th className="text-center py-3 px-4 text-gray-700">Quiz AI %</th>
                <th className="text-center py-3 px-4 text-gray-700">Midterm AI %</th>
                <th className="text-center py-3 px-4 text-gray-700">Final AI %</th>
              </tr>
            </thead>
            <tbody>
              {topicDetails.map((detail, index) => (
                <tr key={detail.topic.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 px-4 text-gray-900">{detail.topic.name}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {detail.topic.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-900">{detail.totalSubmissions}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`${
                        detail.avgAIProbability >= 0.6 ? 'text-red-600' : 
                        detail.avgAIProbability >= 0.4 ? 'text-orange-600' : 
                        'text-green-600'
                      }`}>
                        {Math.round(detail.avgAIProbability * 100)}%
                      </span>
                      {detail.avgAIProbability >= 0.6 && (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-900">{detail.highAICount}</td>
                  <td className="py-3 px-4 text-center text-gray-900">
                    {Math.round(detail.quizAvgAI * 100)}%
                  </td>
                  <td className="py-3 px-4 text-center text-gray-900">
                    {Math.round(detail.midtermAvgAI * 100)}%
                  </td>
                  <td className="py-3 px-4 text-center text-gray-900">
                    {Math.round(detail.finalAvgAI * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
