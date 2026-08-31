import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, UserRoundCheck, GraduationCap } from 'lucide-react';
import { useLocation } from 'wouter';
import MainLayout from '@/layouts/MainLayout';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { collection, doc, getDocs, query, setDoc, where, serverTimestamp } from 'firebase/firestore';
import { matchesCourseSearch, normalizeCourseEntry } from '@/lib/courseEnrollment';
import { getCourseByLecturerAndCode } from '@/lib/courses';

interface LecturerCourseOffer {
  lecturerId: string;
  lecturerName: string;
  courses: Array<{ code: string; title: string }>;
}

interface EnrolledCourse {
  id: string;
  studentId: string;
  lecturerId: string;
  lecturerName: string;
  courseCode: string;
  courseTitle: string;
}

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();
  const [availableLecturers, setAvailableLecturers] = useState<LecturerCourseOffer[]>([]);
  const [registeredCourses, setRegisteredCourses] = useState<EnrolledCourse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<Record<string, boolean>>({});
  const [savingEnrollments, setSavingEnrollments] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.uid) return;

      try {
        const usersSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'lecturer')));
        const lecturers = usersSnapshot.docs
          .filter((userDoc) => userDoc.data().role === 'lecturer')
          .map((userDoc) => {
            const data = userDoc.data();
            const offeredCourses = Array.isArray(data.offeredCourses)
              ? data.offeredCourses.filter((course: { code?: string; title?: string }) => {
                  const normalized = normalizeCourseEntry(course);
                  return normalized.code && normalized.title;
                })
              : [];

            return {
              lecturerId: userDoc.id,
              lecturerName: data.fullName || 'Lecturer',
              courses: offeredCourses,
            } as LecturerCourseOffer;
          })
          .filter((lecturer) => lecturer.courses.length > 0);

        setAvailableLecturers(lecturers);

        const enrollmentsQuery = query(collection(db, 'enrollments'), where('studentId', '==', user.uid));
        const enrollmentSnapshot = await getDocs(enrollmentsQuery);
        setRegisteredCourses(
          enrollmentSnapshot.docs.map((docSnapshot) => ({
            id: docSnapshot.id,
            ...(docSnapshot.data() as any),
          })) as EnrolledCourse[],
        );
      } catch (error) {
        console.error('Unable to load course enrollment data:', error);
      }
    };

    fetchDashboardData();
  }, [user, profile]);

  const filteredLecturers = useMemo(() => {
    return availableLecturers
      .map((lecturer) => ({
        ...lecturer,
        courses: lecturer.courses.filter((course) => {
          const normalized = normalizeCourseEntry(course);
          return matchesCourseSearch(normalized, searchQuery);
        }),
      }))
      .filter((lecturer) => lecturer.courses.length > 0);
  }, [availableLecturers, searchQuery]);

  const handleCourseToggle = (lecturerId: string, course: { code: string; title: string }) => {
    const key = `${lecturerId}__${normalizeCourseEntry(course).code}`;
    setSelectedCourses((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleEnrollSelectedCourses = async () => {
    if (!user?.uid) return;

    const selectedKeys = Object.entries(selectedCourses)
      .filter(([, isSelected]) => isSelected)
      .map(([key]) => key);

    if (!selectedKeys.length) {
      setStatusMessage('Select at least one course before enrolling.');
      return;
    }

    setSavingEnrollments(true);
    setStatusMessage('');

    try {
      const lecturerLookup = new Map(
        availableLecturers.map((lecturer) => [lecturer.lecturerId, lecturer]),
      );

      for (const key of selectedKeys) {
        const [lecturerId, courseCode] = key.split('__');
        const lecturer = lecturerLookup.get(lecturerId);
        const course = lecturer?.courses.find((item) => normalizeCourseEntry(item).code === courseCode);

        if (!lecturer || !course) continue;

        const canonicalCourse = await getCourseByLecturerAndCode(lecturerId, courseCode);
        if (!canonicalCourse?.id) continue;

        const enrollmentId = `${user.uid}_${lecturerId}_${courseCode}`;
        await setDoc(doc(db, 'enrollments', enrollmentId), {
          studentId: user.uid,
          courseId: canonicalCourse.id,
          studentName: profile?.fullName || 'Student',
          lecturerId,
          lecturerName: lecturer.lecturerName,
          courseCode: course.code,
          courseTitle: course.title,
          createdAt: serverTimestamp(),
        });
      }

      const enrollmentSnapshot = await getDocs(
        query(collection(db, 'enrollments'), where('studentId', '==', user.uid)),
      );
      setRegisteredCourses(
        enrollmentSnapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as any),
        })) as EnrolledCourse[],
      );
      setStatusMessage('Enrollment successful. Your selected courses are now saved.');
      setSelectedCourses({});
    } catch (error) {
      console.error('Enrollment failed:', error);
      setStatusMessage('Enrollment failed. Please try again.');
    } finally {
      setSavingEnrollments(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Welcome, {profile?.fullName?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">Browse available lecturers and register for courses.</p>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Available Lecturers</p>
            <p className="text-3xl font-bold">{availableLecturers.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Registered Courses</p>
            <p className="text-3xl font-bold">{registeredCourses.length}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Search</p>
            <p className="text-lg font-bold">{searchQuery || 'All courses'}</p>
          </Card>
        </div>

        {statusMessage && (
          <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section>
            <div className="mb-4 flex items-center gap-3 rounded-md border border-border bg-card p-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by course code or course name"
                className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="space-y-5">
              {filteredLecturers.length === 0 ? (
                <Card className="p-6 text-sm text-muted-foreground">
                  No courses are currently available for your search.
                </Card>
              ) : (
                filteredLecturers.map((lecturer) => (
                  <Card key={lecturer.lecturerId} className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-2 text-primary">
                          <UserRoundCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <h2 className="font-semibold">{lecturer.lecturerName}</h2>
                          <p className="text-sm text-muted-foreground">Lecturer</p>
                        </div>
                      </div>
                      <Badge variant="secondary">{lecturer.courses.length} course{lecturer.courses.length === 1 ? '' : 's'}</Badge>
                    </div>

                    <div className="space-y-3">
                      {lecturer.courses.map((course) => {
                        const normalized = normalizeCourseEntry(course);
                        const key = `${lecturer.lecturerId}__${normalized.code}`;
                        const isSelected = !!selectedCourses[key];

                        return (
                          <div
                            key={normalized.key}
                            className={`flex items-center justify-between rounded-lg border p-3 ${
                              isSelected ? 'border-primary bg-primary/5' : 'border-border bg-secondary/20'
                            }`}
                          >
                            <div>
                              <p className="font-medium">{normalized.code}</p>
                              <p className="text-sm text-muted-foreground">{normalized.title}</p>
                            </div>
                            <Button
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleCourseToggle(lecturer.lecturerId, course)}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <Card className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Your registered courses</h2>
              </div>

              {registeredCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground">You have not enrolled in any course yet.</p>
              ) : (
                <div className="space-y-3">
                  {registeredCourses.map((course) => (
                    <div key={course.id} className="rounded-lg border border-border bg-secondary/20 p-3 flex items-start justify-between">
                      <div>
                        <p className="font-medium">{course.courseCode}</p>
                        <p className="text-sm text-muted-foreground">{course.courseTitle}</p>
                        <p className="mt-2 text-xs text-muted-foreground">Lecturer: {course.lecturerName}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" onClick={async () => {
                          const c = await getCourseByLecturerAndCode(course.lecturerId, course.courseCode);
                          if (c?.id) {
                            setLocation(`/course/${c.id}`);
                          } else {
                            setStatusMessage('No course content published yet.');
                          }
                        }}>Open</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-lg font-semibold">Register selected courses</h2>
              <Button onClick={handleEnrollSelectedCourses} className="w-full" disabled={savingEnrollments}>
                {savingEnrollments ? 'Saving enrollment...' : 'Enroll selected courses'}
              </Button>
            </Card>
          </aside>
        </div>

        <div className="mt-8">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/learning')}>
            Continue to learning
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
