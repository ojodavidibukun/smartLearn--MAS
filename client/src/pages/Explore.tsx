import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useLocation } from 'wouter';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import MainLayout from '@/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { db } from '@/firebase/config';
import { getFacilitatorName, getLessons, getPublishedCourses, getStudentProgress, type Course } from '@/lib/courses';
import { createUserNotification } from '@/lib/notifications';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type CatalogCourse = Course & { lessonCount: number };

type Enrollment = { id: string; courseId?: string; status?: string };

export default function Explore() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [completedByCourse, setCompletedByCourse] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!user?.uid) return;
    const [published, enrollmentSnapshot] = await Promise.all([
      getPublishedCourses(),
      getDocs(query(collection(db, 'enrollments'), where('studentId', '==', user.uid))),
    ]);
    const withCounts = await Promise.all(published.map(async (course) => ({
      ...course,
      lecturerName: await getFacilitatorName(course),
      lessonCount: course.id ? (await getLessons(course.id, true)).length : 0,
    })));
    setCourses(withCounts);
    const enrollmentItems = enrollmentSnapshot.docs.map((item) => ({ id: item.id, ...(item.data() as any) }));
    setEnrollments(enrollmentItems);
    const progressEntries = await Promise.all(enrollmentItems
      .filter((item) => item.status !== 'unenrolled' && item.status !== 'archived' && item.courseId)
      .map(async (item) => {
        const progress = await getStudentProgress(item.courseId, user.uid);
        return [item.courseId, Array.isArray((progress as any).completedLessons) ? (progress as any).completedLessons.length : 0] as const;
      }));
    setCompletedByCourse(Object.fromEntries(progressEntries));
  };

  useEffect(() => { load().catch(() => setMessage('Unable to load courses right now.')); }, [user?.uid]);

  const categories = useMemo(() => Array.from(new Set(courses.map((course) => course.category).filter(Boolean))).sort(), [courses]);
  const filteredCourses = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return courses.filter((course) => {
      const searchable = [course.courseTitle, course.description, course.category, course.level, course.lecturerName].join(' ').toLowerCase();
      return (!normalized || searchable.includes(normalized)) && (category === 'all' || course.category === category);
    });
  }, [category, courses, search]);

  const activeEnrollment = (courseId: string) => enrollments.find((item) => item.courseId === courseId && item.status !== 'unenrolled' && item.status !== 'archived');

  const enroll = async (course: CatalogCourse) => {
    if (!user?.uid || !course.id) return;
    const existing = enrollments.find((item) => item.courseId === course.id);
    const enrollmentId = existing?.id || `${user.uid}_${course.id}`;
    await setDoc(doc(db, 'enrollments', enrollmentId), {
      studentId: user.uid,
      courseId: course.id,
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      lecturerId: course.lecturerId,
      lecturerName: course.lecturerName,
      studentName: profile?.fullName || 'Student',
      status: 'active',
      updatedAt: serverTimestamp(),
      ...(existing ? {} : { createdAt: serverTimestamp() }),
    }, { merge: true });
    await createUserNotification(user.uid, 'student', 'Course enrollment successful', `You are now enrolled in ${course.courseTitle}.`, `/learning/${course.id}`, course.id, 'success');
    await load();
    setMessage(`You are now learning ${course.courseTitle}.`);
  };

  return (
    <MainLayout>
      <div className="container space-y-8 py-8">
        <div><p className="text-sm font-medium uppercase tracking-wide text-primary">YouLearn</p><h1 className="text-3xl font-bold">Explore courses</h1><p className="mt-2 text-muted-foreground">Discover published learning content from facilitators.</p></div>
        {message && <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm">{message}</div>}
        <div className="flex flex-col gap-3 md:flex-row"><div className="flex flex-1 items-center gap-3 rounded-md border border-border bg-card px-3"><Search className="h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by course, topic, or keyword" className="border-0 shadow-none focus-visible:ring-0" /></div><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="all">All topics</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        {filteredCourses.length === 0 ? <Card className="p-6 text-sm text-muted-foreground">No published courses match your search.</Card> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filteredCourses.map((course) => { const enrolled = !!activeEnrollment(course.id!); const hasProgress = (completedByCourse[course.id!] || 0) > 0; return <Card key={course.id} className="flex flex-col p-5"><div className="mb-4 flex gap-2"><Badge variant="outline">{course.category || 'General'}</Badge><Badge variant="secondary">{course.level || 'Beginner'}</Badge></div><h2 className="text-xl font-semibold">{course.courseTitle}</h2><p className="mt-1 text-sm text-muted-foreground">Facilitator: {course.lecturerName}</p><p className="mt-3 flex-1 text-sm text-muted-foreground">{course.description || 'Explore this learning path on YouLearn.'}</p><p className="mt-4 text-xs text-muted-foreground">{course.lessonCount} lessons</p><div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setLocation(enrolled ? `/learning/${course.id}` : `/course/${course.id}`)}>{enrolled ? (hasProgress ? 'Continue Learning' : 'Start Learning') : 'View course'}</Button>{!enrolled && <Button onClick={() => enroll(course)}>Enroll</Button>}</div></Card>; })}</div>}
      </div>
    </MainLayout>
  );
}
