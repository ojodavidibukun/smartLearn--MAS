// SmartLearn MAS - Student Dashboard
// Clean, organized dashboard with clear information hierarchy

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  mockStudent,
  mockCourses,
  mockNotifications,
  mockRecommendations,
  mockStudentPerformance,
} from '@/data/mockData';
import { ArrowRight, BookOpen, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLocation } from 'wouter';
import MainLayout from '@/layouts/MainLayout';
import { useUserProfile } from "../hooks/useUserProfile";



export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const unreadNotifications = mockNotifications.filter((n) => !n.read);
  const highPriorityRecs = mockRecommendations.filter((r) => r.priority === 'high');
  const { profile, loading } = useUserProfile();

  if (loading) return <p>Loading...</p>;

  return (
    <MainLayout>
      <div className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Welcome, {profile?.fullName?.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">Track your progress and continue learning</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Average Score</p>
            <p className="text-3xl font-bold">{mockStudent.averageScore}%</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Active Courses</p>
            <p className="text-3xl font-bold">{mockStudent.totalCourses}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Attendance</p>
            <p className="text-3xl font-bold">{mockStudentPerformance.attendanceRate}%</p>
          </Card>
          <Card className={`p-6 ${mockStudentPerformance.riskLevel === 'low' ? 'bg-accent/5' : 'bg-amber-50'}`}>
            <p className="text-sm text-muted-foreground mb-2">Status</p>
            <p className="text-lg font-bold capitalize">
              {mockStudentPerformance.riskLevel === 'low' ? '✓ On Track' : '⚠ Needs Support'}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Courses */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Your Courses</h2>
                <Button variant="ghost" size="sm" onClick={() => setLocation('/learning')}>
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {mockCourses.map((course) => (
                  <Card key={course.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{course.title}</h3>
                        <p className="text-xs text-muted-foreground">{course.code}</p>
                      </div>
                      <span className="text-sm font-medium text-primary">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </Card>
                ))}
              </div>
            </section>

            {/* Continue Learning */}
            <section>
              <h2 className="text-xl font-bold mb-4">Continue Learning</h2>
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold mb-1">Introduction to Logic Gates</h3>
                    <p className="text-sm text-muted-foreground">Digital Logic • Lesson 1 of 4</p>
                  </div>
                  <BookOpen className="w-5 h-5 text-primary opacity-40" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn about basic logic gates and their applications in digital circuits.
                </p>
                <Button onClick={() => setLocation('/learning')} className="gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Card>
            </section>

            {/* Performance Alert */}
            {highPriorityRecs.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Attention Needed</h2>
                <Card className="p-6 bg-destructive/5 border-destructive/20">
                  <div className="flex gap-4">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{highPriorityRecs[0].title}</h3>
                      <p className="text-sm mb-4">{highPriorityRecs[0].suggestedAction}</p>
                      <Button size="sm" variant="outline" onClick={() => setLocation('/performance')}>
                        View Recommendations
                      </Button>
                    </div>
                  </div>
                </Card>
              </section>
            )}
          </div>

          {/* Sidebar - Right */}
          <div className="space-y-6">
            {/* Notifications */}
            <section>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                Notifications
                {unreadNotifications.length > 0 && (
                  <span className="text-xs bg-destructive text-white px-2 py-0.5 rounded-full">
                    {unreadNotifications.length}
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {mockNotifications.slice(0, 3).map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg border text-sm ${
                      notif.type === 'warning'
                        ? 'bg-destructive/5 border-destructive/20'
                        : notif.type === 'success'
                          ? 'bg-accent/5 border-accent/20'
                          : 'bg-primary/5 border-primary/20'
                    }`}
                  >
                    <p className="font-medium text-xs">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Links */}
            <section>
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation('/learning')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Continue Learning
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation('/performance')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Performance
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation('/agents')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  How It Works
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
