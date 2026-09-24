import { useEffect, useState } from 'react';
import { FolderPlus, Rocket } from 'lucide-react';
import { useLocation } from 'wouter';
import MainLayout from '@/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeCoursesByLecturer } from '@/lib/courses';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LecturerDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeCoursesByLecturer(user.uid, (items) => setCourses(items || []));
    return () => unsubscribe();
  }, [user?.uid]);

  const publishedCount = courses.filter((course) => course.published !== false).length;
  const draftCount = courses.filter((course) => course.published === false).length;
  const recentCourses = [...courses]
    .sort((a, b) => {
      const getTime = (value: any) => value?.toMillis?.() || (value ? new Date(value).getTime() : 0);
      return getTime(b.updatedAt) - getTime(a.updatedAt);
    })
    .slice(0, 4);

  const courseStatus = (course: any) => {
    if (course.isArchived || course.status === 'archived') return 'Archived';
    return course.published === false || course.status === 'draft' ? 'Draft' : 'Published';
  };

  const updatedLabel = (course: any) => {
    const value = course.updatedAt?.toDate?.() || (course.updatedAt ? new Date(course.updatedAt) : null);
    return value && !Number.isNaN(value.getTime()) ? `Updated ${value.toLocaleDateString()}` : 'No update date available';
  };

  return (
    <MainLayout>
      <div className="container py-8 space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Facilitator</p>
            <h1 className="text-3xl font-bold">My content</h1>
          </div>
          <Button onClick={() => setLocation('/lecturer/create-course')}>
            Create Course
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Courses</p>
            <p className="mt-2 text-3xl font-bold">{courses.length}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="mt-2 text-3xl font-bold">{publishedCount}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Drafts</p>
            <p className="mt-2 text-3xl font-bold">{draftCount}</p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">What you can do</h2>
            </div>
            <div className="space-y-3">
              <div className="rounded-md border border-border p-3">
                <p className="font-medium">Build courses</p>
                <p className="text-sm text-muted-foreground">Create a new course, add lessons, and publish learning materials.</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="font-medium">Publish content</p>
                <p className="text-sm text-muted-foreground">Share notes, videos, and quizzes to learners in the public catalog.</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="font-medium">Create quality learning experiences</p>
                <p className="text-sm text-muted-foreground">Create, manage, and publish clear lessons, videos, materials, and quizzes for learners.</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Recently Updated Courses</h2>
                <p className="text-sm text-muted-foreground">A quick view of your latest course work.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLocation('/lecturer/courses')}>My Courses</Button>
            </div>

            {recentCourses.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4">
                <p className="text-sm text-muted-foreground">No courses yet. Create your first learning experience to get started.</p>
                <Button className="mt-3" size="sm" onClick={() => setLocation('/lecturer/create-course')}>Create Course</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCourses.map((course) => {
                  const status = courseStatus(course);
                  return (
                    <div key={course.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{course.courseTitle || 'Untitled Course'}</p>
                        <p className="text-xs text-muted-foreground">{updatedLabel(course)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant={status === 'Archived' ? 'destructive' : status === 'Published' ? 'outline' : 'secondary'}>{status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => setLocation(`/lecturer/courses/${course.id}`)}>Manage Course</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Next actions</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setLocation('/lecturer/create-course')}>Create Course</Button>
            <Button variant="outline" onClick={() => setLocation('/lecturer/courses')}>My Courses</Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
