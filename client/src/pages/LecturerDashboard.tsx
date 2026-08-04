// SmartLearn MAS - Lecturer Dashboard
// Class analytics, student monitoring, and engagement insights

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
  ScatterChart,
  Scatter,
} from 'recharts';
import { mockCourses, mockStudentPerformance } from '@/data/mockData';
import { AlertCircle, TrendingUp, Users, BookOpen } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';

// Mock class data
const classData = {
  totalStudents: 45,
  activeToday: 38,
  averageEngagement: 82,
  completionRate: 76,
};

const performanceTrend = [
  { week: 'Week 1', average: 68, median: 70 },
  { week: 'Week 2', average: 71, median: 72 },
  { week: 'Week 3', average: 74, median: 75 },
  { week: 'Week 4', average: 76, median: 77 },
];

const studentPerformanceData = [
  { name: 'David Okafor', engagement: 85, completion: 92, attendance: 95 },
  { name: 'Daniel Okoye', engagement: 72, completion: 78, attendance: 88 },
  { name: 'Chinedu Eze', engagement: 45, completion: 52, attendance: 65 },
  { name: 'Joy Nwankwo', engagement: 88, completion: 95, attendance: 98 },
  { name: 'Tunde Adebayo', engagement: 62, completion: 68, attendance: 75 },
  { name: 'Musa Ibrahim', engagement: 92, completion: 98, attendance: 100 },
];

const atRiskStudents = [
  { id: 1, name: 'Chinedu Eze', risk: 'High', reason: 'Low engagement and completion rate' },
  { id: 2, name: 'Daniel Okoye', risk: 'Medium', reason: 'Declining attendance' },
  { id: 3, name: 'Amina Bello', risk: 'Medium', reason: 'Recent performance dip' },
];

const courseStats = [
  { name: 'Digital Logic', students: 45, avgScore: 76, completion: 82 },
  { name: 'Data Structures', students: 52, avgScore: 72, completion: 78 },
  { name: 'Web Development', students: 38, avgScore: 81, completion: 88 },
  { name: 'Database Systems', students: 41, avgScore: 74, completion: 75 },
];

export default function LecturerDashboard() {
  return (
    <MainLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Class Overview</h1>
          <p className="text-muted-foreground">Monitor student progress and engagement across your courses</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Students</p>
            <p className="text-3xl font-bold">{classData.totalStudents}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Active Today</p>
            <p className="text-3xl font-bold">{classData.activeToday}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Avg Engagement</p>
            <p className="text-3xl font-bold">{classData.averageEngagement}%</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Completion Rate</p>
            <p className="text-3xl font-bold">{classData.completionRate}%</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Performance Trend */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4">Class Performance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" />
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
                  dataKey="average"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  name="Average"
                />
                <Line
                  type="monotone"
                  dataKey="median"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  name="Median"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* At-Risk Students */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              At-Risk Students
            </h3>
            <div className="space-y-3">
              {atRiskStudents.map((student) => (
                <div key={student.id} className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium">{student.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{student.reason}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Course Statistics */}
        <Card className="p-6 mb-8">
          <h3 className="font-semibold mb-4">Course Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {courseStats.map((course) => (
              <div key={course.name} className="p-4 bg-secondary/30 rounded-lg border border-border">
                <p className="text-sm font-medium mb-3">{course.name}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Students:</span>
                    <span className="font-medium">{course.students}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Score:</span>
                    <span className="font-medium">{course.avgScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completion:</span>
                    <span className="font-medium">{course.completion}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Student Performance Matrix */}
        <Card className="p-6 mb-8">
          <h3 className="font-semibold mb-4">Student Performance Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Engagement</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Completion</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Attendance</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {studentPerformanceData.map((student) => {
                  const status =
                    student.engagement < 60 || student.completion < 60
                      ? 'At Risk'
                      : student.engagement > 85 && student.completion > 90
                        ? 'Excellent'
                        : 'On Track';
                  const statusColor =
                    status === 'At Risk'
                      ? 'bg-destructive/10 text-destructive'
                      : status === 'Excellent'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-primary/10 text-primary';

                  return (
                    <tr key={student.name} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4">{student.name}</td>
                      <td className="py-3 px-4">{student.engagement}%</td>
                      <td className="py-3 px-4">{student.completion}%</td>
                      <td className="py-3 px-4">{student.attendance}%</td>
                      <td className="py-3 px-4">
                        <Badge className={statusColor}>{status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-12 gap-2">
            <Users className="w-4 h-4" />
            Send Class Announcement
          </Button>
          <Button variant="outline" className="h-12 gap-2">
            <BookOpen className="w-4 h-4" />
            View Course Materials
          </Button>
          <Button variant="outline" className="h-12 gap-2">
            <TrendingUp className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
