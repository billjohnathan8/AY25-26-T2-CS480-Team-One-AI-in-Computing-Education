import { useState } from "react";
import { AlertTriangle, Search, TrendingDown, TrendingUp } from "lucide-react";

import type { CourseTopic, QuizAnswer, Student } from "../app/App";

type StudentAnalyticsProps = {
  students: Student[];
  courseTopics: CourseTopic[];
  quizAnswers: QuizAnswer[];
};

export function StudentAnalytics({ students, courseTopics, quizAnswers }: StudentAnalyticsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  if (students.length === 0 || quizAnswers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-600">No student data available. Please import data first.</p>
      </div>
    );
  }

  // Calculate student statistics
  const studentStats = students
    .map((student) => {
      const studentAnswers = quizAnswers.filter((a) => a.studentId === student.id);
      const avgAI = studentAnswers.length > 0 ? studentAnswers.reduce((sum, a) => sum + a.aiProbability, 0) / studentAnswers.length : 0;

      const finalAnswers = studentAnswers.filter((a) => a.testType === "final");
      const avgFinalScore =
        finalAnswers.length > 0
          ? finalAnswers.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / finalAnswers.length
          : 0;

      const highAICount = studentAnswers.filter((a) => a.aiProbability >= 0.5).length;

      return {
        student,
        totalSubmissions: studentAnswers.length,
        avgAIProbability: avgAI,
        avgFinalScore,
        highAICount,
        answers: studentAnswers,
      };
    })
    .filter(
      (stat) =>
        stat.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stat.student.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => b.avgAIProbability - a.avgAIProbability);

  const selectedStudentData = selectedStudent ? studentStats.find((s) => s.student.id === selectedStudent) : null;

  // Topic breakdown for selected student
  const topicBreakdown = selectedStudentData
    ? courseTopics.map((topic) => {
        const topicAnswers = selectedStudentData.answers.filter((a) => a.topicId === topic.id);
        const finalAnswers = topicAnswers.filter((a) => a.testType === "final");

        const avgAI =
          topicAnswers.length > 0 ? topicAnswers.reduce((sum, a) => sum + a.aiProbability, 0) / topicAnswers.length : 0;

        const avgScore =
          finalAnswers.length > 0
            ? finalAnswers.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / finalAnswers.length
            : 0;

        return {
          topic,
          avgAI,
          avgScore,
          count: topicAnswers.length,
        };
      }).filter((t) => t.count > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-gray-900 mb-4">Student Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">Student</th>
                <th className="text-left py-3 px-4 text-gray-700">Email</th>
                <th className="text-center py-3 px-4 text-gray-700">Submissions</th>
                <th className="text-center py-3 px-4 text-gray-700">Avg AI %</th>
                <th className="text-center py-3 px-4 text-gray-700">High AI Count</th>
                <th className="text-center py-3 px-4 text-gray-700">Final Score</th>
                <th className="text-center py-3 px-4 text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {studentStats.map((stat, index) => (
                <tr 
                  key={stat.student.id} 
                  className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${
                    selectedStudent === stat.student.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-gray-900">{stat.student.name}</td>
                  <td className="py-3 px-4 text-gray-600">{stat.student.email}</td>
                  <td className="py-3 px-4 text-center text-gray-900">{stat.totalSubmissions}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`${
                        stat.avgAIProbability >= 0.6 ? 'text-red-600' : 
                        stat.avgAIProbability >= 0.4 ? 'text-orange-600' : 
                        'text-green-600'
                      }`}>
                        {Math.round(stat.avgAIProbability * 100)}%
                      </span>
                      {stat.avgAIProbability >= 0.6 && (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-900">{stat.highAICount}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`${
                      stat.avgFinalScore >= 80 ? 'text-green-600' : 
                      stat.avgFinalScore >= 60 ? 'text-orange-600' : 
                      'text-red-600'
                    }`}>
                      {Math.round(stat.avgFinalScore)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedStudent(
                        selectedStudent === stat.student.id ? null : stat.student.id
                      )}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      {selectedStudent === stat.student.id ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail View */}
      {selectedStudentData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-gray-900">{selectedStudentData.student.name}</h2>
              <p className="text-gray-600">{selectedStudentData.student.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-gray-600">Average AI Usage</p>
                <p className={`text-gray-900 ${
                  selectedStudentData.avgAIProbability >= 0.6 ? 'text-red-600' : 
                  selectedStudentData.avgAIProbability >= 0.4 ? 'text-orange-600' : 
                  'text-green-600'
                }`}>
                  {Math.round(selectedStudentData.avgAIProbability * 100)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">Final Score</p>
                <p className="text-gray-900">{Math.round(selectedStudentData.avgFinalScore)}%</p>
              </div>
            </div>
          </div>

          <h3 className="text-gray-900 mb-4">Topic Breakdown</h3>
          <div className="space-y-3">
            {topicBreakdown.map((item) => (
              <div key={item.topic.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-gray-900">{item.topic.name}</h4>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm mt-1">
                      {item.topic.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-gray-600">AI Usage</p>
                      <p className={`${
                        item.avgAI >= 0.6 ? 'text-red-600' : 
                        item.avgAI >= 0.4 ? 'text-orange-600' : 
                        'text-green-600'
                      }`}>
                        {Math.round(item.avgAI * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Final Score</p>
                      <p className="text-gray-900">{Math.round(item.avgScore)}%</p>
                    </div>
                    <div className="w-16">
                      {item.avgAI > 0.5 && item.avgScore < 70 ? (
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      ) : item.avgAI < 0.3 && item.avgScore > 80 ? (
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      ) : null}
                    </div>
                  </div>
                </div>
                
                {/* Visual indicator */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">AI Usage</span>
                      <span className="text-gray-900">{Math.round(item.avgAI * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.avgAI >= 0.6 ? 'bg-red-500' : 
                          item.avgAI >= 0.4 ? 'bg-orange-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${item.avgAI * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Final Score</span>
                      <span className="text-gray-900">{Math.round(item.avgScore)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${item.avgScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
