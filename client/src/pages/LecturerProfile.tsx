import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MainLayout from '@/layouts/MainLayout';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { normalizeCourseEntry } from '@/lib/courseEnrollment';
import { ensureCourseExists } from '@/lib/courses';
import { Trash2, Plus } from 'lucide-react';

type CourseItem = {
  code: string;
  title: string;
};

export default function LecturerProfile() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [fullName, setFullName] = useState('');
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCourses, setSavingCourses] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        setFullName(data.fullName || '');
        setCourses(Array.isArray(data.offeredCourses) ? data.offeredCourses : []);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleAddCourse = () => {
    const normalized = normalizeCourseEntry({ code: courseCode, title: courseTitle });

    if (!normalized.code || !normalized.title) {
      setMessage('Add both a course code and a course title before saving.');
      return;
    }

    setCourses((current) => {
      const alreadyExists = current.some(
        (item) => normalizeCourseEntry(item).key === normalized.key,
      );

      if (alreadyExists) {
        setMessage('This course is already in your list.');
        return current;
      }

      setMessage('');
      return [...current, { code: normalized.code, title: normalized.title }];
    });

    setCourseCode('');
    setCourseTitle('');
  };

  const handleRemoveCourse = (course: CourseItem) => {
    setCourses((current) => current.filter((item) => normalizeCourseEntry(item).key !== normalizeCourseEntry(course).key));
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSavingProfile(true);
    setMessage('');

    // Ensure the user document exists and update the fullName
    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) {
      await setDoc(userRef, {
        fullName: fullName.trim() || 'Lecturer',
        role: 'lecturer',
        offeredCourses: courses,
        createdAt: serverTimestamp(),
      });
      // Ensure courses exist as course documents
      try {
        await Promise.all(
          courses.map((c) =>
            ensureCourseExists({
              lecturerId: user.uid,
              lecturerName: fullName.trim() || user.displayName || 'Lecturer',
              courseCode: normalizeCourseEntry(c).code,
              courseTitle: normalizeCourseEntry(c).title,
            }),
          ),
        );
      } catch (e) {
        // non-fatal: continue
        console.error('Error syncing offered courses to courses collection', e);
      }
    } else {
      await updateDoc(userRef, {
        fullName: fullName.trim() || 'Lecturer',
      });
    }

    setMessage('Profile updated successfully.');
    setSavingProfile(false);
  };

  const handleSaveCourses = async () => {
    if (!user) return;

    setSavingCourses(true);
    setMessage('');

    await updateDoc(doc(db, 'users', user.uid), {
      offeredCourses: courses,
    });

    // Sync offeredCourses into canonical course documents
    try {
      await Promise.all(
        courses.map((c) =>
          ensureCourseExists({
            lecturerId: user.uid,
            lecturerName: fullName.trim() || user.displayName || 'Lecturer',
            courseCode: normalizeCourseEntry(c).code,
            courseTitle: normalizeCourseEntry(c).title,
          }),
        ),
      );
      setMessage('Offered courses saved and synced to course documents.');
    } catch (e:any) {
      console.error('Error syncing courses:', e);
      setMessage('Offered courses saved but syncing failed. Check console.');
    } finally {
      setSavingCourses(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-10">Loading profile...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Lecturer Profile</h1>
          <p className="text-muted-foreground">View and update your teaching profile and course offerings.</p>
        </div>

        {message && (
          <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Dr. Adebayo"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Role</Label>
                <div className="mt-2 rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm font-medium">
                  Lecturer
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
                {savingProfile ? 'Saving profile...' : 'Save profile'}
              </Button>
              <Button variant="outline" onClick={() => setLocation('/lecturer/manage-courses')} className="w-full mt-2">Manage Course Content</Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Offered courses</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {courses.length} course{courses.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="courseCode">Course code</Label>
                <Input
                  id="courseCode"
                  value={courseCode}
                  onChange={(event) => setCourseCode(event.target.value)}
                  placeholder="CPE310"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="courseTitle">Course title</Label>
                <Input
                  id="courseTitle"
                  value={courseTitle}
                  onChange={(event) => setCourseTitle(event.target.value)}
                  placeholder="Agent-Based Technology"
                  className="mt-2"
                />
              </div>
            </div>

            <Button onClick={handleAddCourse} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add course
            </Button>

            <div className="mt-6 space-y-3">
              {courses.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No courses added yet. Add your first course to get started.
                </div>
              ) : (
                courses.map((course) => (
                  <div
                    key={normalizeCourseEntry(course).key}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-3"
                  >
                    <div>
                      <p className="font-medium">{course.code}</p>
                      <p className="text-sm text-muted-foreground">{course.title}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCourse(course)}
                      aria-label={`Remove ${course.code}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <Button onClick={handleSaveCourses} disabled={savingCourses} className="mt-6 w-full">
              {savingCourses ? 'Saving courses...' : 'Save courses'}
            </Button>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
