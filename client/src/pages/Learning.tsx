import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Video } from 'lucide-react';
import { collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import MainLayout from '@/layouts/MainLayout';
import LecturerLearning from './LecturerLearning';
import { useRoute } from 'wouter';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getActiveEnrollments, getFacilitatorName, getQuizAttempt, getStudentProgress, getStudentQuizAttempts, normalizeCourse, setLessonCompleted, startQuizAttempt, subscribeLessons, subscribeQuizzes, type Course, type CourseQuiz, type Lesson, type QuizAttempt, updateQuizAttempt } from '@/lib/courses';
import { createUserNotification } from '@/lib/notifications';

type Enrollment = { courseId?: string };
type Material = { kind: 'lesson' | 'video' | 'quiz'; course: Course; lesson?: Lesson; quiz?: CourseQuiz };

function youtubeEmbed(url?: string) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const id = parsed.hostname.includes('youtu.be') ? parsed.pathname.slice(1) : parsed.searchParams.get('v');
    return id ? `https://www.youtube.com/embed/${id}` : '';
  } catch { return ''; }
}

export default function Learning() {
  const [, courseParams] = useRoute('/learning/:courseId');
  const routeCourseId = (courseParams as any)?.courseId as string | undefined;
  const { profile, loading: profileLoading } = useUserProfile();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [quizzes, setQuizzes] = useState<Record<string, CourseQuiz[]>>({});
  const [progress, setProgress] = useState<Record<string, string[]>>({});
  const [courseFilter, setCourseFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState<Material | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timeUpMessage, setTimeUpMessage] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    getStudentQuizAttempts(user.uid).then((items) => { if (active) setAttempts(items); }).catch(() => { if (active) setAttempts([]); });
    getActiveEnrollments(user.uid).then(async (enrollments) => {
      const ids = enrollments.map((item) => (item as Enrollment).courseId).filter(Boolean) as string[];
      const loaded = (await Promise.all(ids.map(async (id) => {
        const item = await getDocs(query(collection(db, 'courses'), where('__name__', '==', id)));
        const match = item.docs[0];
        return match ? normalizeCourse(match.data(), match.id) : null;
      }))).filter(Boolean) as Course[];
      if (!active) return;
      const activeCourses = loaded.filter((course) => course.isArchived !== true && course.status !== 'archived');
      const namedCourses = await Promise.all(activeCourses.map(async (course) => ({ ...course, lecturerName: await getFacilitatorName(course) })));
      setCourses(namedCourses);
      if (routeCourseId && namedCourses.some((course) => course.id === routeCourseId)) setCourseFilter(routeCourseId);
      await Promise.all(namedCourses.map(async (course) => {
        const current = await getStudentProgress(course.id!, user.uid);
        if (active) setProgress((value) => ({ ...value, [course.id!]: Array.isArray((current as any).completedLessons) ? (current as any).completedLessons : [] }));
      }));
    }).catch(() => { if (active) setCourses([]); });
    return () => { active = false; };
  }, [user?.uid, routeCourseId]);

  useEffect(() => {
    const unsubscribers = courses.flatMap((course) => course.id ? [
      subscribeLessons(course.id, true, (items) => setLessons((value) => ({ ...value, [course.id!]: items.sort((a, b) => (a.order || 0) - (b.order || 0)) }))),
      subscribeQuizzes(course.id, true, (items) => setQuizzes((value) => ({ ...value, [course.id!]: items }))),
    ] : []);
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [courses]);

  const materials = useMemo(() => courses.flatMap((course) => [
    ...(lessons[course.id!] || []).map((lesson) => ({ kind: lesson.materialType === 'video' ? 'video' : 'lesson', course, lesson } as Material)),
    ...(quizzes[course.id!] || []).map((quiz) => ({ kind: 'quiz' as const, course, quiz } as Material)),
  ]), [courses, lessons, quizzes]);
  const topics = useMemo(() => Array.from(new Set(materials.flatMap((item) => item.lesson?.topic || item.quiz?.questions.map((question) => question.topic || '').filter(Boolean) || []))).sort(), [materials]);
  const filteredMaterials = materials.filter((item) => {
    const itemTopics = item.lesson?.topic ? [item.lesson.topic] : item.quiz?.questions.map((question) => question.topic || '') || [];
    return (courseFilter === 'all' || item.course.id === courseFilter) && (topicFilter === 'all' || itemTopics.includes(topicFilter)) && (typeFilter === 'all' || item.kind === typeFilter);
  });
  const activeMaterial = selected && filteredMaterials.some((item) => item.kind === selected.kind && item.lesson?.id === selected.lesson?.id && item.quiz?.id === selected.quiz?.id) ? selected : filteredMaterials[0];
  const activeQuiz = activeMaterial?.quiz;
  const completedLessons = activeMaterial?.course.id ? progress[activeMaterial.course.id] || [] : [];
  const courseLessons = activeMaterial?.course.id ? lessons[activeMaterial.course.id] || [] : [];
  const quizAttempts = activeQuiz?.id ? attempts.filter((attempt) => attempt.quizId === activeQuiz.id) : [];
  const submittedAttempts = quizAttempts.filter((attempt) => attempt.status !== 'in_progress');
  const activeAttempt = quizAttempts.find((attempt) => attempt.status === 'in_progress');
  const latestSubmittedAttempt = submittedAttempts[submittedAttempts.length - 1];
  const attemptLimit = activeQuiz?.maxAttempts && activeQuiz.maxAttempts > 0 ? activeQuiz.maxAttempts : null;
  const canStartQuiz = !!activeQuiz && !activeAttempt && (activeQuiz.allowRetake || submittedAttempts.length === 0) && (!attemptLimit || submittedAttempts.length < attemptLimit);

  useEffect(() => {
    if (!activeQuiz?.id) return;
    setAnswers(activeAttempt?.answers?.reduce<Record<number, number>>((result, answer, index) => {
      if (typeof answer === 'number') result[index] = answer;
      return result;
    }, {}) || {});
    setSubmittedScore(latestSubmittedAttempt?.score ?? null);
    setTimeUpMessage('');
  }, [activeQuiz?.id, activeAttempt?.id, latestSubmittedAttempt?.id]);

  useEffect(() => {
    if (!activeAttempt || !activeQuiz?.durationMinutes || !activeAttempt.startedAt) {
      setTimeRemaining(null);
      return;
    }
    const startMillis = typeof activeAttempt.startedAt?.toMillis === 'function'
      ? activeAttempt.startedAt.toMillis()
      : new Date(activeAttempt.startedAt).getTime();
    const updateRemaining = () => setTimeRemaining(Math.max(0, activeQuiz.durationMinutes! * 60 - Math.floor((Date.now() - startMillis) / 1000)));
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(timer);
  }, [activeAttempt?.id, activeAttempt?.startedAt, activeQuiz?.durationMinutes]);

  const startQuiz = async () => {
    if (!user?.uid || !activeQuiz?.id || !activeMaterial?.course.id || !canStartQuiz) return;
    setSaving(true);
    try {
      const attemptNumber = submittedAttempts.length + 1;
      const attemptId = await startQuizAttempt({ courseId: activeMaterial.course.id, quizId: activeQuiz.id, studentId: user.uid, studentName: profile?.fullName || 'Student', attemptNumber, answers: [] });
      const started = await getQuizAttempt(attemptId);
      if (started) setAttempts((current) => [...current, started]);
    } finally { setSaving(false); }
  };

  const selectAnswer = (index: number, optionIndex: number) => {
    if (!activeAttempt) return;
    setAnswers((current) => {
      const next = { ...current, [index]: optionIndex };
      const storedAnswers = activeQuiz?.questions.map((_, questionIndex) => typeof next[questionIndex] === 'number' ? next[questionIndex] : -1);
      updateQuizAttempt(activeAttempt.id, { answers: storedAnswers }).catch(() => undefined);
      setAttempts((items) => items.map((attempt) => attempt.id === activeAttempt.id ? { ...attempt, answers: storedAnswers } : attempt));
      return next;
    });
  };

  const submitQuiz = async (automatic = false) => {
    if (!user?.uid || !activeQuiz?.id || !activeMaterial?.course.id || !activeAttempt || (!automatic && Object.keys(answers).length !== activeQuiz.questions.length) || submittedScore !== null) return;
    const topicScores: Record<string, { correct: number; total: number }> = {};
    let correct = 0;
    activeQuiz.questions.forEach((question, index) => {
      const isCorrect = answers[index] === question.correctAnswer;
      const topic = question.topic?.trim();
      if (topic) {
        const score = topicScores[topic] || { correct: 0, total: 0 };
        topicScores[topic] = { correct: score.correct + (isCorrect ? 1 : 0), total: score.total + 1 };
      }
      if (isCorrect) correct += 1;
    });
    setSaving(true);
    try {
      const score = Math.round((correct / activeQuiz.questions.length) * 100);
      const submittedAnswers = activeQuiz.questions.map((_, index) => typeof answers[index] === 'number' ? answers[index] : -1);
      await updateQuizAttempt(activeAttempt.id, { status: 'submitted', score, answers: submittedAnswers, topicScores, submittedAt: serverTimestamp(), completedAt: serverTimestamp() });
      await createUserNotification(user.uid, 'student', 'Quiz result available', `Your result for ${activeQuiz.title} is ${score}%.`, '/performance', activeMaterial.course.id, score < 60 ? 'warning' : 'success');
      setAttempts((items) => items.map((attempt) => attempt.id === activeAttempt.id ? { ...attempt, status: 'submitted', score, answers: submittedAnswers, topicScores } : attempt));
      setSubmittedScore(score);
      if (automatic) setTimeUpMessage('Time is up. Your quiz has been submitted automatically.');
    } finally { setSaving(false); }
  };

  useEffect(() => {
    if (timeRemaining === 0 && activeAttempt && submittedScore === null) submitQuiz(true).catch(() => undefined);
  }, [timeRemaining, activeAttempt?.id, submittedScore]);

  const completeLesson = async (lesson: Lesson) => {
    if (!user?.uid || !activeMaterial?.course.id || !lesson.id) return;
    const done = completedLessons.includes(lesson.id);
    await setLessonCompleted(activeMaterial.course.id, user.uid, lesson.id, !done);
    setProgress((value) => ({ ...value, [activeMaterial.course.id!]: done ? completedLessons.filter((id) => id !== lesson.id) : [...completedLessons, lesson.id!] }));
  };

  if (profileLoading) return <MainLayout><div className="container py-8">Loading...</div></MainLayout>;
  if (profile?.role === 'lecturer') return <LecturerLearning />;

  return <MainLayout><div className="container py-8 space-y-8">
    <div><p className="text-sm font-medium uppercase tracking-wide text-primary">{routeCourseId ? 'Course Learning Hub' : 'My Learning'}</p><h1 className="text-3xl font-bold">{routeCourseId ? (courses.find((course) => course.id === routeCourseId)?.courseTitle || 'Course learning') : 'Learning'}</h1><p className="text-muted-foreground">{routeCourseId ? `Facilitator: ${courses.find((course) => course.id === routeCourseId)?.lecturerName || ''}` : 'Study published materials from your enrolled courses.'}</p></div>
    <Card className="p-5"><div className="grid gap-3 md:grid-cols-3">
      <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="all">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.courseTitle}</option>)}</select>
      <select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="all">All topics</option>{topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}</select>
      <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="all">All material types</option><option value="lesson">Lessons / notes</option><option value="video">Videos</option><option value="quiz">Quizzes</option></select>
    </div></Card>
    {courses.length === 0 ? <Card className="p-6 text-sm text-muted-foreground">Enroll in a course to see its published learning materials.</Card> : <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
      <div className="space-y-3">{filteredMaterials.length === 0 ? <Card className="p-6 text-sm text-muted-foreground">No published materials match these filters.</Card> : filteredMaterials.map((item) => <button key={`${item.kind}-${item.lesson?.id || item.quiz?.id}`} onClick={() => { setSelected(item); setAnswers({}); setSubmittedScore(null); }} className={`w-full rounded-md border p-4 text-left ${activeMaterial === item ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}><div className="flex items-start gap-3"><div className="mt-1 text-primary">{item.kind === 'video' ? <Video className="h-4 w-4" /> : item.kind === 'quiz' ? <ArrowRight className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}</div><div className="min-w-0"><p className="font-medium">{item.lesson?.title || item.quiz?.title}</p><p className="text-xs text-muted-foreground">{item.course.courseTitle} · {item.lesson?.topic || 'Quiz topics'}</p><Badge variant="outline" className="mt-2">{item.kind === 'lesson' ? 'Lesson' : item.kind === 'video' ? 'Video' : 'Quiz'}</Badge></div></div></button>)}</div>
      {activeMaterial && <Card className="p-6"><div className="mb-5"><p className="text-sm text-muted-foreground">{activeMaterial.course.courseCode} · {activeMaterial.course.courseTitle}</p><h2 className="mt-1 text-2xl font-bold">{activeMaterial.lesson?.title || activeMaterial.quiz?.title}</h2><p className="mt-2 text-sm text-muted-foreground">{activeMaterial.lesson?.topic || activeMaterial.quiz?.description || 'Published quiz'}</p></div>
        {activeMaterial.kind !== 'quiz' && <><div className="mb-5 flex items-center justify-between text-sm"><span>Course progress</span><span>{courseLessons.length ? Math.round((courseLessons.filter((lesson) => completedLessons.includes(lesson.id || '')).length / courseLessons.length) * 100) : 0}%</span></div><Progress value={courseLessons.length ? (courseLessons.filter((lesson) => completedLessons.includes(lesson.id || '')).length / courseLessons.length) * 100 : 0} className="mb-6" />{activeMaterial.kind === 'video' && youtubeEmbed(activeMaterial.lesson?.videoUrl) ? <iframe className="mb-6 aspect-video w-full rounded-md" src={youtubeEmbed(activeMaterial.lesson?.videoUrl)} title={activeMaterial.lesson?.title} allowFullScreen /> : <div className="mb-6 whitespace-pre-wrap rounded-md border border-border bg-secondary/30 p-5">{activeMaterial.lesson?.content || 'No lesson notes were added.'}</div>}{activeMaterial.lesson?.materials?.map((material) => <a className="mr-3 text-sm text-primary underline" key={material.url} href={material.url} target="_blank" rel="noreferrer">{material.name}</a>)}<Button className="mt-6" variant={completedLessons.includes(activeMaterial.lesson?.id || '') ? 'outline' : 'default'} onClick={() => activeMaterial.lesson && completeLesson(activeMaterial.lesson)}>{completedLessons.includes(activeMaterial.lesson?.id || '') ? 'Mark incomplete' : 'Mark complete'}</Button></>}
        {activeQuiz && <>{timeUpMessage && <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{timeUpMessage}</div>}{submittedScore !== null ? <div className="py-8 text-center"><p className="text-5xl font-bold">{submittedScore}%</p><p className="mt-2 text-muted-foreground">Your quiz result and topic performance were saved.</p>{activeQuiz.allowRetake && (!attemptLimit || submittedAttempts.length < attemptLimit) && <Button className="mt-6" variant="outline" onClick={() => { setAnswers({}); setSubmittedScore(null); setTimeUpMessage(''); }}>Start another attempt</Button>}</div> : activeAttempt ? <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-secondary/30 px-4 py-3 text-sm"><span>Attempt {activeAttempt.attemptNumber || 1}{attemptLimit ? ` of ${attemptLimit}` : ''}</span>{activeQuiz.durationMinutes && timeRemaining !== null && <span className="font-semibold tabular-nums">Time remaining: {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:{String(timeRemaining % 60).padStart(2, '0')}</span>}</div>{activeQuiz.questions.map((question, index) => <div key={question.id} className="border-b border-border pb-5"><p className="font-medium">{index + 1}. {question.prompt}</p>{question.topic && <p className="mt-1 text-xs text-muted-foreground">Topic: {question.topic}</p>}<div className="mt-3 space-y-2">{question.options.map((option, optionIndex) => <label key={optionIndex} className="flex cursor-pointer gap-2 rounded-md border border-border p-3 text-sm"><input type="radio" name={`question-${question.id}`} checked={answers[index] === optionIndex} onChange={() => selectAnswer(index, optionIndex)} />{option}</label>)}</div></div>)}<Button onClick={() => submitQuiz(false)} disabled={saving || Object.keys(answers).length !== activeQuiz.questions.length || timeRemaining === 0}>{saving ? 'Saving...' : 'Submit quiz'} <ArrowRight className="ml-2 h-4 w-4" /></Button></div> : canStartQuiz ? <div className="py-8 text-center"><p className="text-muted-foreground">{activeQuiz.durationMinutes ? `${activeQuiz.durationMinutes} minute timed quiz` : 'Untimed quiz'}{attemptLimit ? ` · Maximum ${attemptLimit} attempts` : ''}</p><Button className="mt-6" onClick={startQuiz} disabled={saving}>{saving ? 'Starting...' : 'Start quiz'} <ArrowRight className="ml-2 h-4 w-4" /></Button></div> : <div className="py-8 text-center"><p className="font-semibold">You have already completed this quiz.</p><p className="mt-2 text-sm text-muted-foreground">Retakes are not available for this quiz.</p></div>}</>}
      </Card>}
    </div>}
  </div></MainLayout>;
}
