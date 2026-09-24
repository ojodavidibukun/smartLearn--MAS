import { useState } from 'react';
import { useLocation } from 'wouter';
import MainLayout from '@/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ensureCourseExists } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function CreateCourse() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const createCourse = async () => {
    if (!user?.uid) return setMessage('Sign in first.');
    if (!title.trim()) return setMessage('Add a course title.');
    setSaving(true);
    setMessage('');
    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || `course-${Date.now()}`;
      const courseId = await ensureCourseExists({
        lecturerId: user.uid,
        lecturerName: profile?.fullName?.trim() || user.displayName?.trim() || user.email || user.uid,
        courseCode: `${slug}-${Date.now()}`,
        courseTitle: title.trim(),
        description: description.trim(),
        category: category.trim() || 'General',
        level,
        published: false,
        status: 'draft',
        isArchived: false,
      });
      setLocation(`/lecturer/courses/${courseId}`);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to create course.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-3xl space-y-6 py-8">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Facilitator</p>
          <h1 className="text-3xl font-bold">Create Course</h1>
          <p className="mt-2 text-muted-foreground">Set up the course basics, then add lessons, videos, materials, and quizzes from its management page.</p>
        </div>
        {message && <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{message}</div>}
        <Card className="space-y-4 p-6">
          <div><label className="mb-1 block text-sm font-medium">Course title</label><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Introduction to Python" /></div>
          <div><label className="mb-1 block text-sm font-medium">Description</label><textarea className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What will learners gain from this course?" /></div>
          <div className="grid gap-4 md:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Topics or category</label><Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Programming, Python" /></div><div><label className="mb-1 block text-sm font-medium">Level</label><select value={level} onChange={(event) => setLevel(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setLocation('/lecturer/courses')}>Cancel</Button><Button onClick={createCourse} disabled={saving}>{saving ? 'Creating...' : 'Create Course'}</Button></div>
        </Card>
      </div>
    </MainLayout>
  );
}
