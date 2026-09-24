import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Edit3, ExternalLink, Plus, Trash2, Video } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRoute } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  addLesson,
  deleteLesson,
  deleteQuiz,
  getLessons,
  getQuizzes,
  saveQuiz,
  subscribeCoursesByLecturer,
  updateCourse,
  archiveCourse,
  unarchiveCourse,
  updateLesson,
  type CourseQuiz,
  type QuizQuestion,
} from '@/lib/courses';
import type { Course, Lesson } from '@/lib/courses';

type LessonDraft = {
  title: string;
  content: string;
  topic: string;
  tags: string;
  videoUrl: string;
  published: boolean;
  materialType: 'note' | 'video';
};

type QuestionDraft = Omit<QuizQuestion, 'id'>;

const emptyLesson: LessonDraft = {
  title: '', content: '', topic: '', tags: '', videoUrl: '', published: false, materialType: 'note',
};

const emptyQuestion: QuestionDraft = { prompt: '', options: ['', ''], correctAnswer: 0, topic: '' };

function toYoutubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    const videoId = parsed.hostname.includes('youtu.be')
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  } catch {
    return '';
  }
}

export default function LecturerLearning() {
  const { user } = useAuth();
  const [, routeParams] = useRoute('/lecturer/courses/:courseId');
  const routeCourseId = (routeParams as any)?.courseId as string | undefined;
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [quizzes, setQuizzes] = useState<CourseQuiz[]>([]);
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>(emptyLesson);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizPublished, setQuizPublished] = useState(false);
  const [quizDuration, setQuizDuration] = useState('');
  const [quizAllowRetake, setQuizAllowRetake] = useState(false);
  const [quizMaxAttempts, setQuizMaxAttempts] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion]);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseLevel, setCourseLevel] = useState('Beginner');
  const [coursePublished, setCoursePublished] = useState(false);

  const selectedCourse = useMemo(() => courses.find((course) => course.id === courseId), [courses, courseId]);
  const courseTopics = useMemo(() => Array.from(new Set(lessons.map((lesson) => lesson.topic?.trim()).filter(Boolean) as string[])).sort(), [lessons]);

  useEffect(() => {
    if (!selectedCourse) return;
    setCourseTitle(selectedCourse.courseTitle || '');
    setCourseDescription(selectedCourse.description || '');
    setCourseCategory(selectedCourse.category || '');
    setCourseLevel(selectedCourse.level || 'Beginner');
    setCoursePublished(selectedCourse.published !== false && selectedCourse.isArchived !== true);
  }, [selectedCourse]);

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeCoursesByLecturer(user.uid, (items) => {
      setCourses(items);
      setCourseId((current) => current || routeCourseId || items[0]?.id || '');
    });
  }, [user?.uid, routeCourseId]);

  useEffect(() => {
    if (!courseId) {
      setLessons([]);
      setQuizzes([]);
      return;
    }
    const load = async () => {
      const [lessonItems, quizItems] = await Promise.all([getLessons(courseId), getQuizzes(courseId)]);
      setLessons(lessonItems.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setQuizzes(quizItems);
    };
    load().catch((error) => setMessage(error?.message || 'Unable to load course content.'));
  }, [courseId]);

  const refreshContent = async () => {
    if (!courseId) return;
    const [lessonItems, quizItems] = await Promise.all([getLessons(courseId), getQuizzes(courseId)]);
    setLessons(lessonItems.sort((a, b) => (a.order || 0) - (b.order || 0)));
    setQuizzes(quizItems);
  };

  const saveLesson = async () => {
    if (!courseId || !lessonDraft.title.trim()) return setMessage('Add a title before saving the material.');
    setSaving(true);
    try {
      const patch = {
        title: lessonDraft.title.trim(),
        content: lessonDraft.content,
        topic: lessonDraft.topic.trim(),
        tags: lessonDraft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        videoUrl: lessonDraft.videoUrl.trim(),
        published: lessonDraft.published,
        materialType: lessonDraft.materialType,
      };
      if (editingLessonId) {
        await updateLesson(courseId, editingLessonId, patch);
        setMessage('Learning material updated.');
      } else {
        await addLesson(courseId, { ...patch, order: lessons.length + 1 });
        setMessage('Learning material added.');
      }
      setLessonDraft(emptyLesson);
      setEditingLessonId(null);
      await refreshContent();
    } catch (error: any) {
      setMessage(error?.message || 'Unable to save the material.');
    } finally {
      setSaving(false);
    }
  };

  const editLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id || null);
    setLessonDraft({
      title: lesson.title || '', content: lesson.content || '', topic: lesson.topic || '',
      tags: (lesson.tags || []).join(', '), videoUrl: lesson.videoUrl || '',
      published: !!lesson.published, materialType: lesson.materialType || (lesson.videoUrl ? 'video' : 'note'),
    });
  };

  const removeLesson = async (lessonId: string) => {
    if (!courseId) return;
    setSaving(true);
    try {
      await deleteLesson(courseId, lessonId);
      await refreshContent();
      setMessage('Learning material deleted.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to delete the material.');
    } finally {
      setSaving(false);
    }
  };

  const startQuizEdit = (quiz: CourseQuiz) => {
    setEditingQuizId(quiz.id || null);
    setQuizTitle(quiz.title);
    setQuizDescription(quiz.description || '');
    setQuizPublished(!!quiz.published);
    setQuizDuration(quiz.durationMinutes ? String(quiz.durationMinutes) : '');
    setQuizAllowRetake(!!quiz.allowRetake);
    setQuizMaxAttempts(quiz.maxAttempts ? String(quiz.maxAttempts) : '');
    setQuestions(quiz.questions.length ? quiz.questions.map(({ id, ...question }) => question) : [emptyQuestion]);
  };

  const saveQuizDraft = async () => {
    if (!courseId || !quizTitle.trim()) return setMessage('Add a quiz title before saving.');
    const validQuestions = questions.filter((question) => question.prompt.trim() && question.options.filter(Boolean).length >= 2);
    if (!validQuestions.length) return setMessage('Add at least one question with two answer options.');
    setSaving(true);
    try {
      await saveQuiz(courseId, {
        id: editingQuizId || undefined,
        title: quizTitle.trim(), description: quizDescription,
        published: quizPublished,
        durationMinutes: quizDuration ? Math.max(1, Number(quizDuration)) : undefined,
        allowRetake: quizAllowRetake,
        maxAttempts: quizAllowRetake && quizMaxAttempts ? Math.max(1, Number(quizMaxAttempts)) : undefined,
        questions: validQuestions.map((question, index) => ({
          ...question,
          id: `${editingQuizId || 'new'}-${index + 1}`,
          options: question.options.filter(Boolean),
        })),
      });
      await refreshContent();
      setEditingQuizId(null); setQuizTitle(''); setQuizDescription(''); setQuizPublished(false); setQuizDuration(''); setQuizAllowRetake(false); setQuizMaxAttempts(''); setQuestions([emptyQuestion]);
      setMessage('Quiz saved.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to save the quiz.');
    } finally {
      setSaving(false);
    }
  };

  const updateQuestion = (index: number, patch: Partial<QuestionDraft>) => {
    setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, ...patch } : question));
  };

  const saveCourseDetails = async () => {
    if (!courseId || !courseTitle.trim()) return setMessage('Add a course title before saving.');
    setSaving(true);
    try {
      await updateCourse(courseId, { courseTitle: courseTitle.trim(), description: courseDescription.trim(), category: courseCategory.trim() || 'General', level: courseLevel, published: coursePublished, status: coursePublished ? 'published' : 'draft' });
      setMessage('Course details updated.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to update course details.');
    } finally {
      setSaving(false);
    }
  };

  const archiveSelectedCourse = async () => {
    if (!courseId || !window.confirm('Archive this course? It will leave Explore, while existing learning records remain preserved.')) return;
    setSaving(true);
    try {
      await archiveCourse(courseId);
      setCoursePublished(false);
      setMessage('Course archived. Existing learning records were preserved.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to archive course.');
    } finally {
      setSaving(false);
    }
  };

  const unarchiveSelectedCourse = async () => {
    if (!courseId) return;
    setSaving(true);
    try {
      await unarchiveCourse(courseId);
      setCoursePublished(false);
      setMessage('Course restored as a draft. Publish it when it is ready for Explore.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to restore course.');
    } finally {
      setSaving(false);
    }
  };

  if (!selectedCourse) {
    return <MainLayout><div className="container py-8"><h1 className="text-3xl font-bold">Course Management</h1><p className="mt-2 text-muted-foreground">Create a course first, then manage its lessons, videos, materials, and quizzes here.</p></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="container py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="text-muted-foreground">Everything for {selectedCourse.courseTitle} is managed from this page.</p>
        </div>
        {message && <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm">{message}</div>}

        <Card className="p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div><h2 className="font-semibold">{selectedCourse.courseTitle}</h2><p className="text-sm text-muted-foreground">Facilitator: {selectedCourse.lecturerName}</p></div>
            <Badge variant={selectedCourse.isArchived ? 'destructive' : coursePublished ? 'outline' : 'secondary'}>{selectedCourse.isArchived ? 'Archived' : coursePublished ? 'Published' : 'Draft'}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Course title" value={courseTitle} onChange={(event) => setCourseTitle(event.target.value)} />
            <Input placeholder="Topics or category" value={courseCategory} onChange={(event) => setCourseCategory(event.target.value)} />
            <textarea className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2" placeholder="Course description" value={courseDescription} onChange={(event) => setCourseDescription(event.target.value)} />
            <select value={courseLevel} onChange={(event) => setCourseLevel(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={coursePublished} disabled={!!selectedCourse.isArchived} onChange={(event) => setCoursePublished(event.target.checked)} /> Published and visible in Explore</label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><Button onClick={saveCourseDetails} disabled={saving}>Save Course Changes</Button>{selectedCourse.isArchived ? <Button variant="outline" onClick={unarchiveSelectedCourse} disabled={saving}>Unarchive Course</Button> : <Button variant="destructive" onClick={archiveSelectedCourse} disabled={saving}>Archive Course</Button>}</div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div><h2 className="font-semibold">My courses</h2><p className="text-sm text-muted-foreground">Only courses owned by your lecturer account are shown.</p></div>
            <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm md:min-w-80">
              {courses.map((course) => <option key={course.id} value={course.id}>{course.courseTitle} ({course.courseCode})</option>)}
            </select>
          </div>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Learning materials</h2><p className="text-sm text-muted-foreground">Notes and YouTube resources for {selectedCourse.courseTitle}.</p></div><Badge variant="secondary">{lessons.length} items</Badge></div>
            <div className="mb-5 grid gap-3 md:grid-cols-2">
              <Input placeholder="Material title" value={lessonDraft.title} onChange={(event) => setLessonDraft({ ...lessonDraft, title: event.target.value })} />
              <Input placeholder="Topic" value={lessonDraft.topic} onChange={(event) => setLessonDraft({ ...lessonDraft, topic: event.target.value })} />
              <Input placeholder="Tags, separated by commas" value={lessonDraft.tags} onChange={(event) => setLessonDraft({ ...lessonDraft, tags: event.target.value })} />
              <select value={lessonDraft.materialType} onChange={(event) => setLessonDraft({ ...lessonDraft, materialType: event.target.value as 'note' | 'video' })} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="note">Lesson / note</option><option value="video">YouTube resource</option></select>
              {lessonDraft.materialType === 'video' && <Input className="md:col-span-2" placeholder="YouTube URL" value={lessonDraft.videoUrl} onChange={(event) => setLessonDraft({ ...lessonDraft, videoUrl: event.target.value })} />}
              <textarea className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm md:col-span-2" placeholder="Lesson notes or description" value={lessonDraft.content} onChange={(event) => setLessonDraft({ ...lessonDraft, content: event.target.value })} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lessonDraft.published} onChange={(event) => setLessonDraft({ ...lessonDraft, published: event.target.checked })} /> Published for students</label>
              <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => { setEditingLessonId(null); setLessonDraft(emptyLesson); }}>Clear</Button><Button onClick={saveLesson} disabled={saving}>{editingLessonId ? 'Update material' : 'Add material'}</Button></div>
            </div>
            <div className="space-y-3">{lessons.length === 0 ? <p className="text-sm text-muted-foreground">No materials yet.</p> : lessons.map((lesson) => <div key={lesson.id} className="rounded-md border border-border p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 font-medium">{lesson.materialType === 'video' ? <Video className="h-4 w-4 text-primary" /> : <BookOpen className="h-4 w-4 text-primary" />}{lesson.title}</div><p className="mt-1 text-xs text-muted-foreground">{lesson.topic || 'No topic'} · {lesson.published ? 'Published' : 'Unpublished'}</p>{lesson.tags?.length ? <div className="mt-2 flex flex-wrap gap-1">{lesson.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div> : null}</div><div className="flex gap-1"><Button variant="ghost" size="icon" title="Edit material" onClick={() => editLesson(lesson)}><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Delete material" onClick={() => lesson.id && removeLesson(lesson.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>{lesson.videoUrl && <a className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline" href={lesson.videoUrl} target="_blank" rel="noreferrer">Open YouTube resource <ExternalLink className="h-3 w-3" /></a>}</div>)}</div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Quiz management</h2><p className="text-sm text-muted-foreground">Create assessments and group questions by topic.</p></div><Badge variant="secondary">{quizzes.length} quizzes</Badge></div>
            <div className="space-y-3"><Input placeholder="Quiz title" value={quizTitle} onChange={(event) => setQuizTitle(event.target.value)} /><Input placeholder="Description (optional)" value={quizDescription} onChange={(event) => setQuizDescription(event.target.value)} />
              {questions.map((question, index) => <div key={index} className="space-y-2 rounded-md border border-border p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium">Question {index + 1}</p>{questions.length > 1 && <Button variant="ghost" size="icon" title="Remove question" onClick={() => setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index))}><Trash2 className="h-4 w-4" /></Button>}</div><Input placeholder="Question" value={question.prompt} onChange={(event) => updateQuestion(index, { prompt: event.target.value })} /><select value={question.topic || ''} onChange={(event) => updateQuestion(index, { topic: event.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">No topic (optional)</option>{question.topic && !courseTopics.includes(question.topic) && <option value={question.topic}>{question.topic}</option>}{courseTopics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}</select>{question.options.map((option, optionIndex) => <div key={optionIndex} className="flex gap-2"><Input placeholder={`Answer option ${optionIndex + 1}`} value={option} onChange={(event) => updateQuestion(index, { options: question.options.map((item, itemIndex) => itemIndex === optionIndex ? event.target.value : item) })} /><label className="flex items-center gap-1 text-xs whitespace-nowrap"><input type="radio" name={`correct-${index}`} checked={question.correctAnswer === optionIndex} onChange={() => updateQuestion(index, { correctAnswer: optionIndex })} /> Correct</label></div>)}<Button variant="outline" size="sm" onClick={() => updateQuestion(index, { options: [...question.options, ''] })}><Plus className="mr-1 h-3 w-3" />Option</Button></div>)}
              <Button variant="outline" onClick={() => setQuestions((current) => [...current, { ...emptyQuestion, options: ['', ''] }])}><Plus className="mr-1 h-4 w-4" />Question</Button><div className="grid gap-3 md:grid-cols-2"><Input type="number" min="1" placeholder="Duration in minutes (optional)" value={quizDuration} onChange={(event) => setQuizDuration(event.target.value)} /><Input type="number" min="1" placeholder="Maximum attempts (optional)" value={quizMaxAttempts} onChange={(event) => setQuizMaxAttempts(event.target.value)} disabled={!quizAllowRetake} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={quizAllowRetake} onChange={(event) => setQuizAllowRetake(event.target.checked)} /> Allow retake</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={quizPublished} onChange={(event) => setQuizPublished(event.target.checked)} /> Published for students</label><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => { setEditingQuizId(null); setQuizTitle(''); setQuizDescription(''); setQuizDuration(''); setQuizAllowRetake(false); setQuizMaxAttempts(''); setQuestions([emptyQuestion]); }}>Clear</Button><Button onClick={saveQuizDraft} disabled={saving}>{editingQuizId ? 'Update quiz' : 'Save quiz'}</Button></div>
            </div>
            <div className="mt-6 space-y-2">{quizzes.map((quiz) => <div key={quiz.id} className="flex items-center justify-between rounded-md border border-border p-3"><div><p className="font-medium">{quiz.title}</p><p className="text-xs text-muted-foreground">{quiz.questions.length} questions · {quiz.published ? 'Published' : 'Unpublished'}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon" title="Edit quiz" onClick={() => startQuizEdit(quiz)}><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Delete quiz" onClick={async () => { if (courseId && quiz.id) { await deleteQuiz(courseId, quiz.id); await refreshContent(); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>)}</div>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}
