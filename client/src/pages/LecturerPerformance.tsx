import { useEffect, useMemo, useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLessons, getQuizAttempts, getQuizzes, subscribeCoursesByLecturer, type Course, type CourseQuiz, type QuizAttempt } from '@/lib/courses';
import { db } from '@/firebase/config';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { findCourseForEnrollment } from '@/lib/courseEnrollment';

type Enrollment = { id: string; studentId: string; studentName?: string; studentEmail?: string; courseId?: string; courseCode?: string; courseTitle?: string; lecturerId?: string };
type TopicSummary = { topic: string; correct: number; total: number; percentage: number };
type StudentTopic = { student: string; topic: string; percentage: number };
type ProgressSummary = { completed: number; lastUpdated?: any };

function progressColor(percentage: number) {
  if (percentage < 40) return '#DC2626';
  if (percentage < 70) return '#EA580C';
  if (percentage < 90) return '#D97706';
  return '#16A34A';
}

function buildTopicSummaries(attempts: QuizAttempt[], quizzes: CourseQuiz[]): TopicSummary[] {
  const quizMap = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
  const totals = new Map<string, { correct: number; total: number }>();
  attempts.forEach((attempt) => {
    if (attempt.topicScores) {
      Object.entries(attempt.topicScores).forEach(([topic, score]) => {
        const current = totals.get(topic) || { correct: 0, total: 0 };
        totals.set(topic, { correct: current.correct + Number(score.correct || 0), total: current.total + Number(score.total || 0) });
      });
      return;
    }
    const quiz = quizMap.get(attempt.quizId);
    if (!quiz || !attempt.answers) return;
    quiz.questions.forEach((question, index) => {
      const topic = question.topic?.trim() || 'Uncategorized';
      const current = totals.get(topic) || { correct: 0, total: 0 };
      totals.set(topic, { correct: current.correct + (attempt.answers?.[index] === question.correctAnswer ? 1 : 0), total: current.total + 1 });
    });
  });
  return Array.from(totals.entries()).map(([topic, score]) => ({ ...score, topic, percentage: score.total ? Math.round((score.correct / score.total) * 100) : 0 })).sort((a, b) => a.percentage - b.percentage);
}

function buildWeakStudents(attempts: QuizAttempt[], quizzes: CourseQuiz[]): StudentTopic[] {
  const quizMap = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
  const scores = new Map<string, { student: string; topic: string; correct: number; total: number }>();
  attempts.forEach((attempt) => {
    if (attempt.topicScores) {
      Object.entries(attempt.topicScores).forEach(([topic, score]) => {
        const key = `${attempt.studentId}:${topic}`;
        const current = scores.get(key) || { student: attempt.studentName || 'Student', topic, correct: 0, total: 0 };
        scores.set(key, { ...current, correct: current.correct + Number(score.correct || 0), total: current.total + Number(score.total || 0) });
      });
      return;
    }
    const quiz = quizMap.get(attempt.quizId);
    if (!quiz || !attempt.answers) return;
    quiz.questions.forEach((question, index) => {
      const topic = question.topic?.trim() || 'Uncategorized';
      const key = `${attempt.studentId}:${topic}`;
      const current = scores.get(key) || { student: attempt.studentName || 'Student', topic, correct: 0, total: 0 };
      scores.set(key, { ...current, correct: current.correct + (attempt.answers?.[index] === question.correctAnswer ? 1 : 0), total: current.total + 1 });
    });
  });
  return Array.from(scores.values()).map((score) => ({ student: score.student, topic: score.topic, percentage: score.total ? Math.round((score.correct / score.total) * 100) : 0 })).filter((score) => score.percentage < 60).sort((a, b) => a.percentage - b.percentage);
}

export default function LecturerPerformance() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quizzes, setQuizzes] = useState<CourseQuiz[]>([]);
  const [lessonCount, setLessonCount] = useState(0);
  const [progressByEnrollment, setProgressByEnrollment] = useState<Record<string, ProgressSummary>>({});
  const [loading, setLoading] = useState(false);

  const selectedCourse = courses.find((course) => course.id === courseId);
  const courseEnrollments = useMemo(() => enrollments.filter((enrollment) => findCourseForEnrollment(enrollment, courses)?.id === courseId), [enrollments, courses, courseId]);
  const courseAttempts = attempts;
  const topicSummaries = useMemo(() => buildTopicSummaries(courseAttempts, quizzes), [courseAttempts, quizzes]);
  const weakStudents = useMemo(() => buildWeakStudents(courseAttempts, quizzes), [courseAttempts, quizzes]);
  const averageScore = courseAttempts.length ? Math.round(courseAttempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0) / courseAttempts.length) : 0;
  const attemptedStudents = new Set(courseAttempts.map((attempt) => attempt.studentId)).size;

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeCoursesByLecturer(user.uid, (items) => {
      setCourses(items);
      setCourseId((current) => current || items[0]?.id || '');
    });
    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !courseId) {
      setEnrollments([]);
      return;
    }
    const enrollmentQuery = query(
      collection(db, 'enrollments'),
      where('courseId', '==', courseId),
      where('lecturerId', '==', user.uid),
    );
    return onSnapshot(enrollmentQuery, (snapshot) => {
      setEnrollments(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Enrollment, 'id'>) })));
    }, () => setEnrollments([]));
  }, [user?.uid, courseId]);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    const load = async () => {
      const [courseAttempts, courseQuizzes, lessons] = await Promise.all([getQuizAttempts(courseId), getQuizzes(courseId), getLessons(courseId)]);
      setAttempts(courseAttempts);
      setQuizzes(courseQuizzes);
      setLessonCount(lessons.filter((lesson) => lesson.published).length);
      setLoading(false);
    };
    load().catch(() => { setAttempts([]); setQuizzes([]); setLoading(false); });
  }, [courseId, courseEnrollments.length]);

  useEffect(() => {
    if (!courseId || !courseEnrollments.length) {
      setProgressByEnrollment({});
      return;
    }
    const unsubscribers = courseEnrollments.map((enrollment) => {
      const progressRef = doc(db, 'courseProgress', `${courseId}_${enrollment.studentId}`);
      return onSnapshot(progressRef, (snapshot) => {
        const data = snapshot.exists() ? snapshot.data() as { completedLessons?: unknown[]; updatedAt?: any } : {};
        setProgressByEnrollment((current) => ({
          ...current,
          [enrollment.id]: {
            completed: Array.isArray(data.completedLessons) ? data.completedLessons.length : 0,
            lastUpdated: data.updatedAt,
          },
        }));
      }, () => {
        setProgressByEnrollment((current) => ({ ...current, [enrollment.id]: { completed: 0 } }));
      });
    });
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [courseId, courseEnrollments]);

  const completionTotal = courseEnrollments.reduce((sum, enrollment) => sum + (progressByEnrollment[enrollment.id]?.completed || 0), 0);
  const completionRate = courseEnrollments.length && lessonCount ? Math.round((completionTotal / (courseEnrollments.length * lessonCount)) * 100) : 0;

  if (!selectedCourse) return <MainLayout><div className="container py-8"><h1 className="text-3xl font-bold">Student performance</h1><p className="mt-2 text-muted-foreground">Add or select a course to view learner analytics.</p></div></MainLayout>;

  return (
    <MainLayout>
      <div className="container py-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><h1 className="text-3xl font-bold">Student performance</h1><p className="text-muted-foreground">See where learners are progressing and where teaching support may help.</p></div><select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm md:min-w-80">{courses.map((course) => <option key={course.id} value={course.id}>{course.courseTitle} ({course.courseCode})</option>)}</select></div>
        {loading && <p className="text-sm text-muted-foreground">Loading course analytics...</p>}
        <div className="grid gap-4 md:grid-cols-4"><Card className="p-5"><p className="text-sm text-muted-foreground">Enrolled students</p><p className="mt-2 text-3xl font-bold">{courseEnrollments.length}</p></Card><Card className="p-5"><p className="text-sm text-muted-foreground">Students attempting quizzes</p><p className="mt-2 text-3xl font-bold">{attemptedStudents}</p></Card><Card className="p-5"><p className="text-sm text-muted-foreground">Average quiz performance</p><p className="mt-2 text-3xl font-bold">{courseAttempts.length ? `${averageScore}%` : 'No data'}</p></Card><Card className="p-5"><p className="text-sm text-muted-foreground">Published lesson completion</p><p className="mt-2 text-3xl font-bold">{lessonCount ? `${completionRate}%` : 'No lessons'}</p></Card></div>

        <Card className="p-5"><div className="mb-4"><h2 className="font-semibold">Enrolled students</h2><p className="text-sm text-muted-foreground">Progress updates from each student&apos;s courseProgress document.</p></div>{courseEnrollments.length === 0 ? <p className="text-sm text-muted-foreground">No enrolled students were found for this course.</p> : <><div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label="Progress color legend"><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#DC2626' }} />Red: 0–39%</span><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#EA580C' }} />Orange: 40–69%</span><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#D97706' }} />Amber: 70–89%</span><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#16A34A' }} />Green: 90–100%</span></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border"><th className="py-2 text-left">Student</th><th className="py-2 text-left">Completed</th><th className="py-2 text-left">Published lessons</th><th className="py-2 text-left">Progress</th></tr></thead><tbody>{courseEnrollments.map((enrollment) => { const summary = progressByEnrollment[enrollment.id] || { completed: 0 }; const percent = lessonCount ? Math.round((summary.completed / lessonCount) * 100) : 0; const color = lessonCount ? progressColor(percent) : undefined; return <tr key={enrollment.id} className="border-b border-border"><td className="py-3">{enrollment.studentName || 'Student'}{enrollment.studentEmail && <div className="text-xs text-muted-foreground">{enrollment.studentEmail}</div>}</td><td className="py-3">{summary.completed}</td><td className="py-3">{lessonCount}</td><td className="py-3">{lessonCount ? <div className="min-w-32"><span className="font-semibold" style={{ color }}>{percent}%</span><div className="mt-1 h-1.5 w-full rounded-full bg-secondary"><div className="h-1.5 rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} /></div></div> : <span className="text-muted-foreground">No lessons</span>}</td></tr>; })}</tbody></table></div></>}</Card>
        <section className="grid gap-6 lg:grid-cols-2"><Card className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Topic performance</h2><p className="text-sm text-muted-foreground">Calculated from recorded quiz answers.</p></div><Badge variant="secondary">{topicSummaries.length} topics</Badge></div>{topicSummaries.length === 0 ? <p className="text-sm text-muted-foreground">No topic-level quiz attempts have been recorded for this course.</p> : <div className="space-y-4">{topicSummaries.map((topic) => <div key={topic.topic}><div className="mb-1 flex justify-between text-sm"><span>{topic.topic}</span><span className={topic.percentage < 60 ? 'font-semibold text-destructive' : 'font-medium'}>{topic.percentage}%</span></div><div className="h-2 rounded bg-secondary"><div className={`h-2 rounded ${topic.percentage < 60 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${topic.percentage}%` }} /></div></div>)}</div>}</Card><Card className="p-5"><div className="mb-4"><h2 className="font-semibold">Students needing attention</h2><p className="text-sm text-muted-foreground">Students below 60% in a recorded topic.</p></div>{weakStudents.length === 0 ? <p className="text-sm text-muted-foreground">No weak-topic results are available.</p> : <div className="space-y-3">{weakStudents.map((item, index) => <div key={`${item.student}-${item.topic}-${index}`} className="flex items-center justify-between rounded-md border border-border p-3"><div><p className="font-medium">{item.student}</p><p className="text-sm text-muted-foreground">Weak in {item.topic}</p></div><Badge variant="destructive">{item.percentage}%</Badge></div>)}</div>}</Card></section>
      </div>
    </MainLayout>
  );
}
