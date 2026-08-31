// SmartLearn MAS - Lecturer Dashboard
// Class analytics, student monitoring, and engagement insights

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users, BookOpen, UserCog } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase/config';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { subscribeCoursesByLecturer, getCourseByLecturerAndCode } from '@/lib/courses';

type Enrollment = {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  courseCode: string;
  courseTitle: string;
  lecturerId: string;
  semester?: string;
  session?: string;
  academicYear?: string;
};

export default function LecturerDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedSession, setSelectedSession] = useState('All');
  const [lessonsByCourse, setLessonsByCourse] = useState<Record<string, any[]>>({});
  const [progressByEnrollment, setProgressByEnrollment] = useState<Record<string, { completed: number; lastUpdated?: any }>>({});

  // subscribe to courses
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeCoursesByLecturer(user.uid, (list) => {
      setCourses(list || []);
    });
    return () => unsub();
  }, [user]);

  // subscribe to enrollments for this lecturer
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'enrollments'), where('lecturerId', '==', user.uid));
    const unsub = onSnapshot(q, async (snap) => {
      const docs: Enrollment[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Enrollment));
      setEnrollments(docs);
    });
    return () => unsub();
  }, [user]);

  // subscribe to lessons per course (published state included)
  useEffect(() => {
    if (!courses.length) return;
    const unsubList: Array<() => void> = [];
    courses.forEach((c) => {
      const lessonsCol = collection(db, 'courses', c.id, 'lessons');
      const unsub = onSnapshot(lessonsCol, (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setLessonsByCourse((prev) => ({ ...prev, [c.id]: items }));
      });
      unsubList.push(unsub);
    });
    return () => unsubList.forEach((u) => u());
  }, [courses]);

  // subscribe to courseProgress per enrollment
  useEffect(() => {
    if (!enrollments.length || !courses.length) return;

    const unsubList: Array<() => void> = [];

    enrollments.forEach((enr) => {
      // find course id for this enrollment via courseCode and lecturerId
      const course = courses.find((c) => c.courseCode === enr.courseCode && c.lecturerId === enr.lecturerId);
      if (!course || !course.id) return;
      const progressDoc = doc(db, 'courseProgress', `${course.id}_${enr.studentId}`);
      const unsub = onSnapshot(progressDoc, (snap) => {
        const data = snap.exists() ? (snap.data() as any) : { completedLessons: [] };
        setProgressByEnrollment((prev) => ({ ...prev, [enr.id]: { completed: Array.isArray(data.completedLessons) ? data.completedLessons.length : 0, lastUpdated: data.updatedAt } }));
      });
      unsubList.push(unsub);
    });

    return () => unsubList.forEach((u) => u());
  }, [enrollments, courses]);

  const semesterOptions = useMemo(
    () => Array.from(new Set(enrollments.map((e) => e.semester).filter((value): value is string => !!value))).sort(),
    [enrollments],
  );

  const sessionOptions = useMemo(
    () => Array.from(new Set(enrollments.map((e) => e.session).filter((value): value is string => !!value))).sort(),
    [enrollments],
  );

  const filteredEnrollments = useMemo(
    () =>
      enrollments.filter((enr) => {
        const matchesSemester = selectedSemester === 'All' || enr.semester === selectedSemester;
        const matchesSession = selectedSession === 'All' || enr.session === selectedSession;
        return matchesSemester && matchesSession;
      }),
    [enrollments, selectedSemester, selectedSession],
  );

  // Derived metrics
  const totalCourses = courses.length;
  const uniqueStudentIds = Array.from(new Set(filteredEnrollments.map((e: Enrollment) => e.studentId)));
  const totalStudents = uniqueStudentIds.length;
  const totalPublishedLessons = Object.values(lessonsByCourse).reduce((sum, arr) => sum + arr.filter((l:any)=>!!l.published).length, 0);
  const totalMaterials = Object.values(lessonsByCourse).reduce((sum, arr) => sum + arr.filter((l:any)=>Array.isArray(l.materials)?l.materials.length:0).reduce((s:number,m:any)=>s+m,0), 0);

  // compute overall completion rate across enrollments where course published lessons > 0
  const completionRates: number[] = filteredEnrollments.map((enr: Enrollment) => {
    const course = courses.find((c) => c.courseCode === enr.courseCode && c.lecturerId === enr.lecturerId);
    if (!course || !course.id) return 0;
    const lessons = lessonsByCourse[course.id] || [];
    const published = lessons.filter((l:any)=>!!l.published).length;
    if (published === 0) return 0;
    const prog = progressByEnrollment[enr.id];
    const completed = prog ? prog.completed : 0;
    return Math.round((completed / published) * 100);
  }).filter((n: number) => !isNaN(n));

  const overallCompletion = completionRates.length ? Math.round(completionRates.reduce((a,b)=>a+b,0)/completionRates.length) : 0;
  const activeProgressing = completionRates.filter((p) => p > 0 && p < 100).length;
  const lowOrNoProgress = completionRates.filter((p) => p === 0).length;

  // Helper to compute student row data
  const studentRows = filteredEnrollments.map((enr: Enrollment) => {
    const course = courses.find((c) => c.courseCode === enr.courseCode && c.lecturerId === enr.lecturerId);
    const lessons = course?.id ? (lessonsByCourse[course.id] || []) : [];
    const published = lessons.filter((l:any)=>!!l.published).length;
    const prog = progressByEnrollment[enr.id];
    const completed = prog ? prog.completed : 0;
    const percent = published ? Math.round((completed / published) * 100) : 0;
    const status = percent === 0 ? 'Not Started' : percent < 50 ? 'Needs Attention' : 'On Track';
    return {
      enrollmentId: enr.id,
      studentId: enr.studentId,
      studentName: enr.studentName || 'Student',
      studentEmail: (enr as any).studentEmail || '',
      courseCode: enr.courseCode,
      courseTitle: enr.courseTitle,
      completed,
      published,
      percent,
      lastUpdated: prog ? prog.lastUpdated : null,
      status,
    };
  });

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Class Overview</h1>
            <p className="text-muted-foreground">Monitor student progress and engagement across your courses</p>
          </div>
          <div>
            <Button onClick={() => setLocation('/lecturer/manage-courses')} className="ml-2">Manage Course Content</Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Courses</p>
            <p className="text-3xl font-bold">{totalCourses}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Students</p>
            <p className="text-3xl font-bold">{totalStudents}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Published Lessons</p>
            <p className="text-3xl font-bold">{totalPublishedLessons}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Overall Completion</p>
            <p className="text-3xl font-bold">{overallCompletion}%</p>
          </Card>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">Semester</label>
              <select
                value={selectedSemester}
                onChange={(event) => setSelectedSemester(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="All">All semesters</option>
                {semesterOptions.map((semester: string) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">Session</label>
              <select
                value={selectedSession}
                onChange={(event) => setSelectedSession(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="All">All sessions</option>
                {sessionOptions.map((session: string) => (
                  <option key={session} value={session}>
                    {session}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Student Performance Table */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Student Monitoring</h3>
            <div className="text-sm text-muted-foreground">Showing students enrolled in your courses</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Course</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Completed</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Total Lessons</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">% Complete</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {studentRows.map((s: any) => (
                  <tr key={s.enrollmentId} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">{s.studentName}</td>
                    <td className="py-3 px-4">{s.studentEmail || ''}</td>
                    <td className="py-3 px-4">{s.courseTitle} <div className="text-xs text-muted-foreground">{s.courseCode}</div></td>
                    <td className="py-3 px-4">{s.completed}</td>
                    <td className="py-3 px-4">{s.published}</td>
                    <td className="py-3 px-4">{s.percent}%</td>
                    <td className="py-3 px-4"><Badge>{s.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-12 gap-2">
            <Users className="w-4 h-4" />
            Send Class Announcement
          </Button>
          <Button variant="outline" className="h-12 gap-2">
            <BookOpen className="w-4 h-4" />
            View Course Materials
          </Button>
          <Button variant="outline" className="h-12 gap-2">
            Export Report
          </Button>
          <Button variant="default" className="h-12 gap-2" onClick={() => setLocation('/lecturer-profile')}>
            <UserCog className="w-4 h-4" />
            Lecturer Profile
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
