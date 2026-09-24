import { useEffect, useState } from 'react';
import MainLayout from '@/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { ensureCourseExists, addLesson, getLessons, updateLesson, updateCourse, archiveCourse, deleteLesson, uploadMaterial, appendMaterialToLesson, subscribeCoursesByLecturer } from '@/lib/courses';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function LecturerCourseManager() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [published, setPublished] = useState(false);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [editingPublished, setEditingPublished] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      if (!courseId || !title) return;
    };
    load();
  }, [user, courseId, title]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeCoursesByLecturer(user.uid, (list) => {
      setCoursesList(list || []);
      // if a courseId is selected but removed, clear selection
      if (courseId && list.every((c:any) => c.id !== courseId)) {
        setCourseId(null);
        setTitle(''); setDescription(''); setCategory(''); setLevel('Beginner'); setPublished(false); setLessons([]);
      }
    });
    return () => unsub();
  }, [user, courseId]);

  const createCourse = async () => {
    if (!user?.uid) return setMessage('Sign in first');
    if (!title) return setMessage('Provide a course title');
    setLoading(true);
    try {
      const facilitatorName = profile?.fullName?.trim() || user.displayName?.trim();
      const id = courseId || await ensureCourseExists({ lecturerId: user.uid, lecturerName: facilitatorName || user.email || user.uid, courseCode: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || `course-${Date.now()}`, courseTitle: title, description, category: category || 'General', level, published: false });
      if (courseId) await updateCourse(courseId, { courseTitle: title, description, category: category || 'General', level, published });
      setCourseId(id);
      setMessage(published ? 'Course saved and published.' : 'Course saved as draft.');
    } catch (e: any) {
      setMessage(e?.message || String(e));
    } finally { setLoading(false); }
  };

  const onAddLesson = async () => {
    if (!courseId) return setMessage('Create or select a course first');
    if (!lessonTitle) return setMessage('Enter lesson title');
    setLoading(true);
    try {
      await addLesson(courseId, { title: lessonTitle, content: '', order: lessons.length + 1 });
      const ls = await getLessons(courseId);
      setLessons(ls.sort((a,b)=> (a.order||0)-(b.order||0)));
      setLessonTitle('');
      setMessage('Lesson added');
    } catch (e:any) { setMessage(e?.message || String(e)); }
    finally { setLoading(false); }
  };

  const startEdit = (l:any) => {
    setEditingLessonId(l.id);
    setEditingTitle(l.title || '');
    setEditingContent(l.content || '');
    setEditingPublished(!!l.published);
  };

  const saveEdit = async () => {
    if (!courseId || !editingLessonId) return;
    setLoading(true);
    try {
      await updateLesson(courseId, editingLessonId, { title: editingTitle, content: editingContent, published: editingPublished });
      const ls = await getLessons(courseId);
      setLessons(ls.sort((a,b)=> (a.order||0)-(b.order||0)));
      setEditingLessonId(null);
      setMessage('Lesson updated');
    } catch (e:any) { setMessage(e?.message || String(e)); }
    finally { setLoading(false); }
  };

  const onDeleteLesson = async (lessonId:string) => {
    if (!courseId) return;
    setLoading(true);
    try {
      await deleteLesson(courseId, lessonId);
      const ls = await getLessons(courseId);
      setLessons(ls.sort((a,b)=> (a.order||0)-(b.order||0)));
      setMessage('Lesson deleted');
    } catch (e:any) { setMessage(e?.message || String(e)); }
    finally { setLoading(false); }
  };

  const onUploadMaterial = async (lessonId:string, file: File | null) => {
    if (!courseId || !file) return setMessage('No file selected');
    setLoading(true);
    try {
      const mat = await uploadMaterial(courseId, lessonId, file);
      await appendMaterialToLesson(courseId, lessonId, mat as any);
      const ls = await getLessons(courseId);
      setLessons(ls.sort((a,b)=> (a.order||0)-(b.order||0)));
      setMessage('Material uploaded');
    } catch (e:any) { setMessage(e?.message || String(e)); }
    finally { setLoading(false); }
  };

  const onArchiveCourse = async () => {
    if (!courseId || !window.confirm('Remove this course? This course will no longer be available for new students to discover or enroll in. Existing learning records will be preserved.')) return;
    setLoading(true);
    try {
      await archiveCourse(courseId);
      setPublished(false);
      setMessage('Course archived. Existing learning records were preserved.');
    } catch (e: any) { setMessage(e?.message || String(e)); }
    finally { setLoading(false); }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Manage Course Content</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Course</h3>
            <div className="mb-2">
              <label className="block text-sm mb-1">Select saved course</label>
              <select value={courseId || ''} onChange={async (e:any) => {
                const val = e.target.value || null;
                setCourseId(val);
                if (val) {
                  // load course doc
                  const c = coursesList.find((x:any) => x.id === val);
                  if (c) {
                    setTitle(c.courseTitle || '');
                    setDescription(c.description || '');
                    setCategory(c.category || '');
                    setLevel(c.level || 'Beginner');
                    setPublished(c.published !== false);
                    const ls = await getLessons(val);
                    ls.sort((a,b)=> (a.order||0)-(b.order||0));
                    setLessons(ls);
                  }
                } else {
                  // clear fields for new
                  setTitle(''); setDescription(''); setCategory(''); setLevel('Beginner'); setPublished(false); setLessons([]);
                }
              }} className="w-full border rounded p-2">
                <option value="">-- Create New Course --</option>
                {coursesList.map((c:any) => (
                  <option key={c.id} value={c.id}>{c.courseTitle}</option>
                ))}
              </select>
            </div>
            <Input placeholder="Course title" value={title} onChange={(e:any)=>setTitle(e.target.value)} className="mb-2" />
            <Input placeholder="Short description" value={description} onChange={(e:any)=>setDescription(e.target.value)} className="mb-2" />
            <Input placeholder="Topics or category (e.g. Python, programming)" value={category} onChange={(e:any)=>setCategory(e.target.value)} className="mb-2" />
            <select value={level} onChange={(e:any)=>setLevel(e.target.value)} className="mb-2 w-full rounded border p-2">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={(e:any)=>setPublished(e.target.checked)} /> Make this course visible in Explore</label>
            <div className="mb-2 text-sm font-medium">Status: {coursesList.find((course) => course.id === courseId)?.isArchived ? 'Archived' : published ? 'Published' : 'Draft'}</div>
            <div className="flex gap-2 mt-2">
              <Button onClick={createCourse} disabled={loading}>{loading ? 'Saving...' : 'Save course'}</Button>
              {courseId && !coursesList.find((course) => course.id === courseId)?.isArchived && <Button variant="destructive" onClick={onArchiveCourse} disabled={loading}>Archive course</Button>}
            </div>
            {message && <div className="text-sm text-muted-foreground mt-2">{message}</div>}
          </Card>

          {editingLessonId && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Edit lesson</h3>
              <Input placeholder="Lesson title" value={editingTitle} onChange={(e:any)=>setEditingTitle(e.target.value)} className="mb-2" />
              <div className="mb-2">
                <label className="block text-sm mb-1">Content</label>
                <textarea className="w-full border rounded p-2" rows={6} value={editingContent} onChange={(e:any)=>setEditingContent(e.target.value)} />
              </div>
              <div className="mb-2">
                <label className="inline-flex items-center gap-2"><input type="checkbox" checked={editingPublished} onChange={(e:any)=>setEditingPublished(e.target.checked)} /> Publish</label>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEdit} disabled={loading}>Save</Button>
                <Button variant="ghost" onClick={() => setEditingLessonId(null)}>Cancel</Button>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="font-semibold mb-2">Add Lesson</h3>
            <Input placeholder="Lesson title" value={lessonTitle} onChange={(e:any)=>setLessonTitle(e.target.value)} className="mb-2" />
            <div className="flex gap-2">
              <Button onClick={onAddLesson} disabled={loading || !courseId}>Add Lesson</Button>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Lessons</h4>
              {lessons.length === 0 ? <div className="text-sm text-muted-foreground">No lessons yet</div> : (
                <div className="space-y-2">
                  {lessons.map(l => (
                    <div key={l.id} className="rounded border p-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium">{l.title}</div>
                          <div className="text-xs text-muted-foreground">Order: {l.order} • {l.published ? 'Published' : 'Unpublished'}</div>
                          {Array.isArray(l.materials) && l.materials.length > 0 && (
                            <div className="mt-2 text-xs">
                              Materials:
                              <ul>
                                {l.materials.map((m:any) => (
                                  <li key={m.url}><a className="text-primary underline" href={m.url} target="_blank" rel="noreferrer">{m.name}</a></li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => startEdit(l)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => onDeleteLesson(l.id)}>Delete</Button>
                          </div>
                          <div>
                            <input type="file" onChange={(e:any) => onUploadMaterial(l.id, e.target.files?.[0] ?? null)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
