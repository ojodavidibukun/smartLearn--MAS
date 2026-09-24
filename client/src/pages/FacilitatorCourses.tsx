import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import MainLayout from '@/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getLessons, getQuizzes, subscribeCoursesByLecturer, type Course } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type CourseSummary = Course & { resourceCount: number; quizCount: number };

function statusFor(course: Course) {
  if (course.isArchived || course.status === 'archived') return 'Archived';
  return course.published === false || course.status === 'draft' ? 'Draft' : 'Published';
}

function formatUpdated(value: any) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : 'Not updated yet';
}

export default function FacilitatorCourses() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeCoursesByLecturer(user.uid, async (items) => {
      setLoading(true);
      const summaries = await Promise.all(items.map(async (course) => {
        const [lessons, quizzes] = course.id ? await Promise.all([getLessons(course.id), getQuizzes(course.id)]) : [[], []];
        return { ...course, resourceCount: lessons.length, quizCount: quizzes.length } as CourseSummary;
      }));
      setCourses(summaries);
      setLoading(false);
    });
  }, [user?.uid]);

  return (
    <MainLayout>
      <div className="container space-y-8 py-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-medium uppercase tracking-wide text-primary">Facilitator</p><h1 className="text-3xl font-bold">My Courses</h1><p className="mt-2 text-muted-foreground">Your personal course library. Select a course to manage everything inside it.</p></div><Button onClick={() => setLocation('/lecturer/create-course')}>Create Course</Button></div>
        {loading ? <p className="text-sm text-muted-foreground">Loading your courses...</p> : courses.length === 0 ? <Card className="p-6"><p className="text-sm text-muted-foreground">You have not created a course yet.</p><Button className="mt-4" onClick={() => setLocation('/lecturer/create-course')}>Create your first course</Button></Card> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{courses.map((course) => { const status = statusFor(course); return <Card key={course.id} className="flex flex-col p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{course.courseTitle}</h2><p className="mt-1 text-sm text-muted-foreground">{course.category || 'General'} · {course.level || 'Beginner'}</p></div><Badge variant={status === 'Archived' ? 'destructive' : status === 'Published' ? 'outline' : 'secondary'}>{status}</Badge></div><p className="mt-4 flex-1 text-sm text-muted-foreground">{course.description || 'No description yet.'}</p><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-md bg-secondary/40 p-3"><p className="text-muted-foreground">Resources</p><p className="font-semibold">{course.resourceCount}</p></div><div className="rounded-md bg-secondary/40 p-3"><p className="text-muted-foreground">Quizzes</p><p className="font-semibold">{course.quizCount}</p></div></div><p className="mt-4 text-xs text-muted-foreground">Updated {formatUpdated(course.updatedAt)}</p><Button className="mt-4" onClick={() => setLocation(`/lecturer/courses/${course.id}`)}>Manage Course</Button></Card>; })}</div>}
      </div>
    </MainLayout>
  );
}
