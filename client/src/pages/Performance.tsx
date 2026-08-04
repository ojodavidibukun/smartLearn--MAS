// SmartLearn MAS - Performance & Recommendations Page
// Student performance analytics and personalized recommendations

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  mockStudentPerformance,
  mockQuizResults,
  mockRecommendations,
} from '@/data/mockData';
import { TrendingUp, Target, Zap } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';

const performanceData = [
  { name: 'Quiz 1', score: 45 },
  { name: 'Quiz 2', score: 82 },
  { name: 'Quiz 3', score: 65 },
];

const attendanceData = [
  { name: 'Week 1', attendance: 100 },
  { name: 'Week 2', attendance: 92 },
  { name: 'Week 3', attendance: 88 },
  { name: 'Week 4', attendance: 92 },
];

const performanceBreakdown = [
  { name: 'Quiz Performance', value: 64, color: '#3b82f6' },
  { name: 'Assignments', value: 85, color: '#10b981' },
  { name: 'Attendance', value: 92, color: '#f59e0b' },
];

export default function Performance() {
  const riskColor =
    mockStudentPerformance.riskLevel === 'low'
      ? 'bg-accent/10 border-accent/20 text-accent'
      : mockStudentPerformance.riskLevel === 'medium'
        ? 'bg-amber-100 border-amber-200 text-amber-800'
        : 'bg-destructive/10 border-destructive/20 text-destructive';

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Performance</h1>
          <p className="text-muted-foreground">
            Track your progress and see personalized recommendations
          </p>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Quiz Average</p>
                <p className="text-3xl font-bold">{mockStudentPerformance.averageQuizScore}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground">Based on completed quizzes</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Assignment Completion</p>
                <p className="text-3xl font-bold">{mockStudentPerformance.assignmentCompletion}%</p>
              </div>
              <Target className="w-8 h-8 text-accent opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground">Assignments submitted</p>
          </Card>

          <Card className={`p-6 border ${riskColor}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium mb-1">Overall Status</p>
                <p className="text-2xl font-bold capitalize">{mockStudentPerformance.riskLevel}</p>
              </div>
            </div>
            <p className="text-xs">Current performance level</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quiz Performance Chart */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4">Quiz Performance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary)', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Performance Breakdown */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Performance Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {performanceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Attendance Chart */}
        <Card className="p-6 mb-8">
          <h3 className="font-semibold mb-4">Attendance Rate: {mockStudentPerformance.attendanceRate}%</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="attendance" fill="var(--accent)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Recommendations Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Personalized Recommendations</h2>
          <p className="text-muted-foreground mb-6">
            Here are tailored suggestions to help you improve and succeed in your courses.
          </p>

          <div className="space-y-4">
            {mockRecommendations.map((rec) => {
              const priorityColor =
                rec.priority === 'high'
                  ? 'bg-destructive/10 border-destructive/20'
                  : rec.priority === 'medium'
                    ? 'bg-amber-100 border-amber-200'
                    : 'bg-primary/10 border-primary/20';

              const priorityBadgeColor =
                rec.priority === 'high'
                  ? 'bg-destructive text-white'
                  : rec.priority === 'medium'
                    ? 'bg-amber-600 text-white'
                    : 'bg-primary text-white';

              return (
                <Card key={rec.id} className={`p-6 border ${priorityColor}`}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold">{rec.title}</h3>
                    <Badge className={priorityBadgeColor}>{rec.priority}</Badge>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm">{rec.suggestedAction}</p>
                  </div>

                  <Button size="sm" variant="outline" className="gap-2 mt-4">
                    <Zap className="w-4 h-4" />
                    Take Action
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
