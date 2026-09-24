import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Compass, Sparkles } from 'lucide-react';
import { useLocation } from 'wouter';
import MainLayout from '@/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getActiveEnrollments, getCourseById, getFacilitatorName, getLessons, getPublishedCourses, getStudentProgress, getStudentQuizAttempts, type Course, type QuizAttempt } from '@/lib/courses';

type LearningCourse = Course & { completed: number; total: number; enrollmentId: string };

type TopicScore = { topic: string; percentage: number };

function timestampValue(value: any) {
  if (value?.toMillis) return value.toMillis();
  const parsed = value ? new Date(value).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [myLearning, setMyLearning] = useState<LearningCourse[]>([]);
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [weakTopics, setWeakTopics] = useState<TopicScore[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [enrollments, publishedCourses, attempts] = await Promise.all([
          getActiveEnrollments(user.uid),
          getPublishedCourses(),
          getStudentQuizAttempts(user.uid),
        ]);
        const enrolledCourses = (await Promise.all(enrollments.map(async (enrollment: any) => {
          if (!enrollment.courseId) return null;
          const course = await getCourseById(enrollment.courseId);
          if (!course?.id || course.isArchived === true || course.status === 'archived') return null;
          const [progress, lessons] = await Promise.all([getStudentProgress(course.id, user.uid), getLessons(course.id, true)]);
          const completedLessons = Array.isArray((progress as any).completedLessons) ? (progress as any).completedLessons : [];
          return { ...course, lecturerName: await getFacilitatorName(course), completed: completedLessons.length, total: lessons.length, enrollmentId: enrollment.id, updatedAt: (progress as any).updatedAt } as LearningCourse;
        }))).filter(Boolean) as LearningCourse[];
        const enrolledIds = new Set(enrolledCourses.map((course) => course.id));
        const topicTotals = new Map<string, { correct: number; total: number }>();
        attempts.filter((attempt) => attempt.status !== 'in_progress').forEach((attempt: QuizAttempt) => {
          Object.entries(attempt.topicScores || {}).forEach(([topic, score]) => {
            const current = topicTotals.get(topic) || { correct: 0, total: 0 };
            topicTotals.set(topic, { correct: current.correct + Number(score.correct || 0), total: current.total + Number(score.total || 0) });
          });
        });
        const weak = Array.from(topicTotals.entries())
          .map(([topic, score]) => ({ topic, percentage: score.total ? Math.round((score.correct / score.total) * 100) : 0 }))
          .filter((item) => item.percentage < 60)
          .sort((a, b) => a.percentage - b.percentage)
          .slice(0, 5);
        if (!active) return;
        setMyLearning(enrolledCourses);
        setRecommendations(await Promise.all(publishedCourses.filter((course) => !enrolledIds.has(course.id)).slice(0, 4).map(async (course) => ({ ...course, lecturerName: await getFacilitatorName(course) }))));
        setWeakTopics(weak);
        setRecentActivity([...enrolledCourses].sort((a, b) => timestampValue((b as any).updatedAt) - timestampValue((a as any).updatedAt)).slice(0, 3));
      } catch (error) {
        console.error('Unable to load student dashboard:', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [user?.uid]);

  const overallProgress = useMemo(() => {
    const total = myLearning.reduce((sum, course) => sum + course.total, 0);
    const completed = myLearning.reduce((sum, course) => sum + course.completed, 0);
    return total ? Math.round((completed / total) * 100) : 0;
  }, [myLearning]);

  if (profileLoading || loading) return <MainLayout><div className="container py-8">Loading your learning dashboard...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="container space-y-8 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">My Learning</p>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.fullName?.split(' ')[0] || 'Learner'}</h1>
            <p className="mt-2 text-muted-foreground">Continue where you stopped and discover your next useful lesson.</p>
          </div>
          <Button onClick={() => setLocation('/explore')}><Compass className="mr-2 h-4 w-4" /> Explore courses</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5"><p className="text-sm text-muted-foreground">Courses in progress</p><p className="mt-2 text-3xl font-bold">{myLearning.length}</p></Card>
          <Card className="p-5"><p className="text-sm text-muted-foreground">Your progress</p><p className="mt-2 text-3xl font-bold">{overallProgress}%</p></Card>
          <Card className="p-5"><p className="text-sm text-muted-foreground">Areas to review</p><p className="mt-2 text-3xl font-bold">{weakTopics.length}</p></Card>
        </div>

        <section>
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl font-bold">Continue Learning</h2><p className="text-sm text-muted-foreground">Your active courses and progress.</p></div><Button variant="ghost" onClick={() => setLocation('/learning')}>My Learning <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
          {myLearning.length === 0 ? <Card className="p-6 text-sm text-muted-foreground">You have no active courses yet. Explore the catalog to start learning.</Card> : <div className="grid gap-4 md:grid-cols-2">{myLearning.map((course) => { const percent = course.total ? Math.round((course.completed / course.total) * 100) : 0; return <Card key={course.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{course.courseTitle}</h3><p className="text-sm text-muted-foreground">Facilitator: {course.lecturerName}</p></div><Badge variant="outline">{percent}%</Badge></div><Progress value={percent} className="mt-4" /><Button className="mt-4" variant="outline" onClick={() => setLocation(`/learning/${course.id}`)}>{course.completed > 0 ? 'Continue Learning' : 'Start Learning'}</Button></Card>; })}</div>}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5"><div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Recommended For You</h2></div>{recommendations.length === 0 ? <p className="text-sm text-muted-foreground">Explore more courses to receive new recommendations.</p> : <div className="space-y-3">{recommendations.map((course) => <button key={course.id} className="w-full rounded-md border border-border p-3 text-left hover:bg-secondary/40" onClick={() => setLocation(`/course/${course.id}`)}><p className="font-medium">{course.courseTitle}</p><p className="text-sm text-muted-foreground">{course.category || 'General'} · {course.level || 'Beginner'}</p></button>)}</div>}</Card>
          <Card className="p-5"><div className="mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Weak Topics / Areas to Review</h2></div>{weakTopics.length === 0 ? <p className="text-sm text-muted-foreground">Complete a quiz to identify topics that need review.</p> : <div className="flex flex-wrap gap-2">{weakTopics.map((topic) => <Badge key={topic.topic} variant="destructive">{topic.topic} · {topic.percentage}%</Badge>)}</div>}<Button className="mt-4" variant="outline" onClick={() => setLocation('/performance')}>View performance</Button></Card>
        </div>

        <Card className="p-5"><h2 className="text-lg font-semibold">Recent Learning Activity</h2>{recentActivity.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Your recent course activity will appear here.</p> : <div className="mt-3 space-y-2">{recentActivity.map((course) => <div key={course.id} className="flex items-center justify-between border-b border-border py-2 text-sm"><span>{course.courseTitle}</span><span className="text-muted-foreground">{course.completed} lessons completed</span></div>)}</div>}</Card>
      </div>
    </MainLayout>
  );
}
