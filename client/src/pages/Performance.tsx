import { useEffect, useMemo, useState } from 'react';
import { collection, getDoc, getDocs, query, where, doc } from 'firebase/firestore';
import MainLayout from '@/layouts/MainLayout';
import LecturerPerformance from './LecturerPerformance';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getStudentProgress, getStudentQuizAttempts, getQuizzes, getLessons, type Course, type CourseQuiz, type Lesson, type QuizAttempt } from '@/lib/courses';

type Enrollment = { courseId?: string };
type TopicScore = { topic: string; correct: number; total: number; percentage: number };
type Resource = { kind: 'Lesson' | 'Video' | 'Quiz'; title: string; topic: string; course: Course };

function completedAtValue(attempt: QuizAttempt) {
  const value = attempt.completedAt;
  if (value?.toDate) return value.toDate().getTime();
  return value ? new Date(value).getTime() : 0;
}

export default function Performance() {
  const { profile, loading: profileLoading } = useUserProfile();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quizzes, setQuizzes] = useState<Record<string, CourseQuiz[]>>({});
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [progress, setProgress] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const load = async () => {
      setLoading(true);
      const enrollmentSnapshot = await getDocs(query(collection(db, 'enrollments'), where('studentId', '==', user.uid)));
      const ids = enrollmentSnapshot.docs.map((item) => (item.data() as Enrollment).courseId).filter(Boolean) as string[];
      const loadedCourses = (await Promise.all(ids.map(async (id) => {
        const snapshot = await getDoc(doc(db, 'courses', id));
        return snapshot.exists() ? ({ id: snapshot.id, ...(snapshot.data() as any) } as Course) : null;
      }))).filter(Boolean) as Course[];
      const [studentAttempts, courseData] = await Promise.all([
        getStudentQuizAttempts(user.uid),
        Promise.all(loadedCourses.map(async (course) => ({
          course,
          lessons: await getLessons(course.id!, true),
          quizzes: await getQuizzes(course.id!),
          progress: await getStudentProgress(course.id!, user.uid),
        }))),
      ]);
      setCourses(loadedCourses);
      setAttempts(studentAttempts);
      setLessons(Object.fromEntries(courseData.map((item) => [item.course.id, item.lessons])));
      setQuizzes(Object.fromEntries(courseData.map((item) => [item.course.id, item.quizzes.filter((quiz) => quiz.published)])));
      setProgress(Object.fromEntries(courseData.map((item) => [item.course.id, Array.isArray((item.progress as any).completedLessons) ? (item.progress as any).completedLessons : []])));
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [user?.uid]);

  const topicScores = useMemo<TopicScore[]>(() => {
    const totals = new Map<string, { correct: number; total: number }>();
    attempts.forEach((attempt) => Object.entries(attempt.topicScores || {}).forEach(([topic, score]) => {
      const current = totals.get(topic) || { correct: 0, total: 0 };
      totals.set(topic, { correct: current.correct + Number(score.correct || 0), total: current.total + Number(score.total || 0) });
    }));
    return Array.from(totals.entries()).map(([topic, score]) => ({ ...score, topic, percentage: score.total ? Math.round((score.correct / score.total) * 100) : 0 })).sort((a, b) => a.percentage - b.percentage);
  }, [attempts]);
  const weakTopics = topicScores.filter((item) => item.percentage < 60);
  const quizAverage = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0) / attempts.length) : null;
  const totalLessons = courses.reduce((sum, course) => sum + (lessons[course.id!] || []).length, 0);
  const completedLessons = courses.reduce((sum, course) => sum + (progress[course.id!] || []).length, 0);
  const resources = useMemo<Resource[]>(() => courses.flatMap((course) => [
    ...(lessons[course.id!] || []).map((lesson) => ({ kind: lesson.materialType === 'video' ? 'Video' as const : 'Lesson' as const, title: lesson.title, topic: lesson.topic || '', course })),
    ...(quizzes[course.id!] || []).map((quiz) => ({ kind: 'Quiz' as const, title: quiz.title, topic: Array.from(new Set(quiz.questions.map((question) => question.topic).filter(Boolean))).join(', '), course })),
  ]), [courses, lessons, quizzes]);
  const recommendations = weakTopics.flatMap((weak) => resources.filter((resource) => resource.topic.toLowerCase().split(', ').includes(weak.topic.toLowerCase()) || resource.topic.toLowerCase().includes(weak.topic.toLowerCase())).map((resource) => ({ ...resource, weakTopic: weak.topic })));
  const recentAttempts = [...attempts].sort((a, b) => completedAtValue(b) - completedAtValue(a)).slice(0, 5);

  if (profileLoading) return <MainLayout><div className="container py-8">Loading...</div></MainLayout>;
  if (profile?.role === 'lecturer') return <LecturerPerformance />;
  if (loading) return <MainLayout><div className="container py-8">Loading your performance...</div></MainLayout>;

  return <MainLayout><div className="container py-8 space-y-8">
    <div><h1 className="text-3xl font-bold">Your Performance</h1><p className="text-muted-foreground">Review your quiz results, progress, and topics to revisit.</p></div>
    <div className="grid gap-4 md:grid-cols-3"><Card className="p-5"><p className="text-sm text-muted-foreground">Quiz average</p><p className="mt-2 text-3xl font-bold">{quizAverage === null ? 'No data' : `${quizAverage}%`}</p><p className="mt-1 text-xs text-muted-foreground">Based on submitted quizzes</p></Card><Card className="p-5"><p className="text-sm text-muted-foreground">Course progress</p><p className="mt-2 text-3xl font-bold">{totalLessons ? `${Math.round((completedLessons / totalLessons) * 100)}%` : 'No lessons'}</p><p className="mt-1 text-xs text-muted-foreground">{completedLessons} of {totalLessons} published lessons completed</p></Card><Card className="p-5"><p className="text-sm text-muted-foreground">Quizzes completed</p><p className="mt-2 text-3xl font-bold">{attempts.length}</p></Card></div>
    <div className="grid gap-6 lg:grid-cols-2"><Card className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Topic performance</h2><p className="text-sm text-muted-foreground">Calculated from your recorded question answers.</p></div><Badge variant="secondary">{topicScores.length} topics</Badge></div>{topicScores.length === 0 ? <p className="text-sm text-muted-foreground">Submit a published quiz to see topic performance.</p> : <div className="space-y-4">{topicScores.map((item) => <div key={item.topic}><div className="mb-1 flex justify-between text-sm"><span>{item.topic}</span><span className={item.percentage < 60 ? 'font-semibold text-destructive' : 'font-medium'}>{item.percentage}% · {item.percentage < 60 ? 'Needs Review' : item.percentage < 80 ? 'Average' : 'Strong'}</span></div><div className="h-2 rounded bg-secondary"><div className={`h-2 rounded ${item.percentage < 60 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${item.percentage}%` }} /></div></div>)}</div>}</Card><Card className="p-5"><h2 className="font-semibold">Recent results</h2>{recentAttempts.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No quiz results yet.</p> : <div className="mt-4 space-y-3">{recentAttempts.map((attempt) => <div key={attempt.id} className="flex items-center justify-between border-b border-border pb-3"><div><p className="font-medium">{quizzes[attempt.courseId]?.find((quiz) => quiz.id === attempt.quizId)?.title || 'Quiz'}</p><p className="text-xs text-muted-foreground">{courses.find((course) => course.id === attempt.courseId)?.courseTitle || 'Course'}</p></div><Badge variant={Number(attempt.score || 0) < 60 ? 'destructive' : 'secondary'}>{attempt.score || 0}%</Badge></div>)}</div>}</Card></div>
    <Card className="p-5"><div className="mb-4"><h2 className="font-semibold">Topics to Review</h2><p className="text-sm text-muted-foreground">Topics below 60%, using the same weak-topic threshold as lecturer analytics.</p></div>{weakTopics.length === 0 ? <p className="text-sm text-muted-foreground">No weak topics have been identified.</p> : <div className="flex flex-wrap gap-2">{weakTopics.map((topic) => <Badge key={topic.topic} variant="destructive">{topic.topic} · {topic.percentage}%</Badge>)}</div>}</Card>
    <section><h2 className="mb-4 text-2xl font-bold">Personalized Recommendations</h2>{weakTopics.length === 0 ? <Card className="p-5 text-sm text-muted-foreground">Complete a quiz to receive topic-based recommendations.</Card> : recommendations.length === 0 ? <Card className="p-5 text-sm text-muted-foreground">No learning resources are currently available for these topics.</Card> : <div className="grid gap-4 md:grid-cols-2">{recommendations.map((resource, index) => <Card key={`${resource.kind}-${resource.title}-${index}`} className="p-5"><Badge variant="outline">{resource.kind}</Badge><h3 className="mt-3 font-semibold">{resource.title}</h3><p className="mt-1 text-sm text-muted-foreground">Review {resource.weakTopic} in {resource.course.courseTitle}.</p></Card>)}</div>}</section>
  </div></MainLayout>;
}
