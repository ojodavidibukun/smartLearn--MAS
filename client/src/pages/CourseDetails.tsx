import { useEffect, useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useLocation, useRoute } from 'wouter';
import { getCourseById, getLessons, getStudentProgress, setLessonCompleted } from '@/lib/courses';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CourseDetails() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/course/:courseId');
  const courseId = (params as any)?.courseId as string;
  const { user } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [progress, setProgress] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const c = await getCourseById(courseId);
        if (!c) {
          setError('Course not found');
          setLoading(false);
          return;
        }
        setCourse(c);
        let ls = await getLessons(courseId, user?.uid !== c.lecturerId);
        ls.sort((a, b) => (a.order || 0) - (b.order || 0));
        setLessons(ls);
        if (user?.uid) {
          const p = await getStudentProgress(courseId, user.uid);
          setProgress(Array.isArray((p as any).completedLessons) ? (p as any).completedLessons : []);
        }
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId, user]);

  const toggleComplete = async (lessonId: string) => {
    if (!user?.uid) return;
    const isCompleted = progress.includes(lessonId);
    await setLessonCompleted(courseId, user.uid, lessonId, !isCompleted);
    setProgress((p) => (isCompleted ? p.filter((id) => id !== lessonId) : [...p, lessonId]));
  };

  if (loading) return <MainLayout><p className="container py-8">Loading...</p></MainLayout>;
  if (error) return <MainLayout><p className="container py-8 text-destructive">{error}</p></MainLayout>;

  const total = lessons.length;
  const completedCount = lessons.filter((l) => progress.includes(l.id)).length;
  const currentLesson = lessons[currentIndex];

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{course.courseTitle}</h1>
            <p className="text-muted-foreground">{course.courseCode} • Lecturer: {course.lecturerName}</p>
          </div>
          <div>
            <Button variant="ghost" onClick={() => setLocation('/dashboard')}>Back to dashboard</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <Card className="p-6 mb-4">
              <h3 className="font-semibold mb-2">Course description</h3>
              <p className="text-sm text-muted-foreground">{course.description || 'No description provided.'}</p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Lesson: {currentLesson?.title || 'No lessons'}</h3>
                <div className="text-sm text-muted-foreground">{completedCount}/{total} completed</div>
              </div>

              {currentLesson ? (
                <div>
                  <div className="prose max-w-none mb-4">{currentLesson.content || 'No content yet.'}</div>

                  {currentLesson.videoUrl && (
                    <div className="mb-4 aspect-video overflow-hidden rounded-md border border-border">
                      <iframe
                        className="h-full w-full"
                        src={currentLesson.videoUrl.includes('youtube.com/watch')
                          ? currentLesson.videoUrl.replace('watch?v=', 'embed/')
                          : currentLesson.videoUrl.replace('youtu.be/', 'youtube.com/embed/')}
                        title={currentLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={() => toggleComplete(currentLesson.id)}>{progress.includes(currentLesson.id) ? 'Mark as incomplete' : 'Mark as completed'}</Button>
                    <Button variant="outline" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>Previous</Button>
                    <Button variant="outline" onClick={() => setCurrentIndex(Math.min(lessons.length - 1, currentIndex + 1))} disabled={currentIndex === lessons.length - 1}>Next</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No lessons available for this course.</p>
              )}
            </Card>
          </section>

          <aside>
            <Card className="p-4 mb-4">
              <h4 className="font-semibold mb-2">Lessons</h4>
              <div className="space-y-2">
                {lessons.length === 0 && <div className="text-sm text-muted-foreground">No lessons yet.</div>}
                {lessons.map((l, idx) => (
                  <div key={l.id} className={`p-2 rounded-md cursor-pointer ${currentIndex === idx ? 'bg-primary/5' : 'bg-transparent'}`} onClick={() => setCurrentIndex(idx)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{l.title}</div>
                        <div className="text-xs text-muted-foreground">{l.order != null ? `Lesson ${l.order}` : `Lesson ${idx + 1}`}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{progress.includes(l.id) ? '✓' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold mb-2">Progress</h4>
              <div className="w-full bg-border h-2 rounded mb-2">
                <div className="bg-primary h-2 rounded" style={{ width: total ? `${Math.round((completedCount / total) * 100)}%` : '0%' }} />
              </div>
              <div className="text-sm text-muted-foreground">{total ? `${Math.round((completedCount / total) * 100)}%` : '0%'} complete</div>
            </Card>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
