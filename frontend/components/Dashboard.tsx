import { AlertTriangle, TrendingUp, Users, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

import type { CourseTopic, Student, QuizAnswer } from "../app/App";

type DashboardProps = {
  courseTopics: CourseTopic[];
  students: Student[];
  quizAnswers: QuizAnswer[];
};

export function Dashboard({ courseTopics, students, quizAnswers }: DashboardProps) {
  if (quizAnswers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-gray-900 mb-2">No Data Available</h2>
        <p className="text-gray-600">Import data to see analytics and insights.</p>
      </div>
    );
  }

  // Calculate statistics
  const totalAnswers = quizAnswers.length;
  const highAIAnswers = quizAnswers.filter((a) => a.aiProbability >= 0.5).length;
  const averageAIProb = quizAnswers.reduce((sum, a) => sum + a.aiProbability, 0) / totalAnswers;

  // AI probability distribution
  const aiDistribution = [
    { range: '0-20%', count: quizAnswers.filter((a) => a.aiProbability < 0.2).length, color: '#10b981' },
    { range: '20-40%', count: quizAnswers.filter((a) => a.aiProbability >= 0.2 && a.aiProbability < 0.4).length, color: '#84cc16' },
    { range: '40-60%', count: quizAnswers.filter((a) => a.aiProbability >= 0.4 && a.aiProbability < 0.6).length, color: '#eab308' },
    { range: '60-80%', count: quizAnswers.filter((a) => a.aiProbability >= 0.6 && a.aiProbability < 0.8).length, color: '#f97316' },
    { range: '80-100%', count: quizAnswers.filter((a) => a.aiProbability >= 0.8).length, color: '#ef4444' },
  ];

  // AI usage by topic
  const topicStats = courseTopics.map((topic) => {
    const topicAnswers = quizAnswers.filter((a) => a.topicId === topic.id);
    const avgAI = topicAnswers.length > 0
      ? topicAnswers.reduce((sum, a) => sum + a.aiProbability, 0) / topicAnswers.length
      : 0;
    return {
      name: topic.name,
      aiUsage: Math.round(avgAI * 100),
      count: topicAnswers.length,
    };
  }).sort((a, b) => b.aiUsage - a.aiUsage);

  // AI usage by test type
  const testTypeStats = ['quiz', 'midterm', 'final'].map((type) => {
    const typeAnswers = quizAnswers.filter((a) => a.testType === type);
    const avgAI = typeAnswers.length > 0
      ? typeAnswers.reduce((sum, a) => sum + a.aiProbability, 0) / typeAnswers.length
      : 0;
    return {
      testType: type.charAt(0).toUpperCase() + type.slice(1),
      aiUsage: Math.round(avgAI * 100),
      count: typeAnswers.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Total Submissions</p>
              <p className="text-gray-900">{totalAnswers}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">High AI Probability</p>
              <p className="text-gray-900">{highAIAnswers}</p>
              <p className="text-gray-500">({Math.round((highAIAnswers / totalAnswers) * 100)}%)</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Average AI Probability</p>
              <p className="text-gray-900">{Math.round(averageAIProb * 100)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Students Analyzed</p>
              <p className="text-gray-900">{students.length}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* AI Probability Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-4">AI Probability Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aiDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Test Type Analysis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-gray-900 mb-4">AI Usage by Test Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={testTypeStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="testType" />
              <YAxis label={{ value: 'AI Usage (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="aiUsage" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Topic Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-gray-900 mb-4">AI Usage by Course Topic</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topicStats} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" label={{ value: 'AI Usage (%)', position: 'insideBottom', offset: -5 }} />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="aiUsage" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Flagged Topics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-gray-900 mb-4">Topics with Highest AI Usage</h2>
        <div className="space-y-3">
          {topicStats.slice(0, 5).map((topic, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-gray-900">{index + 1}.</span>
                <span className="text-gray-900">{topic.name}</span>
                <span className="text-gray-500">({topic.count} submissions)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${topic.aiUsage}%` }}
                  />
                </div>
                <span className="text-gray-900 w-12 text-right">{topic.aiUsage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
