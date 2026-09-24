import { db } from '@/firebase/config';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { storage } from '@/firebase/config';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createStudentAnnouncement, createUserNotification } from '@/lib/notifications';

export type Course = {
  id?: string;
  courseCode: string;
  courseTitle: string;
  lecturerId: string;
  lecturerName: string;
  description?: string;
  category?: string;
  level?: string;
  published?: boolean;
  isArchived?: boolean;
  status?: 'draft' | 'published' | 'archived';
  createdAt?: any;
  updatedAt?: any;
};

export function normalizeCourse(course: Record<string, any>, id?: string): Course {
  const storedTitle = typeof course.courseTitle === 'string' && course.courseTitle.trim()
    ? course.courseTitle.trim()
    : typeof course.title === 'string' && course.title.trim()
      ? course.title.trim()
      : typeof course.name === 'string' && course.name.trim()
        ? course.name.trim()
        : 'Untitled Course';
  return { ...course, ...(id ? { id } : {}), courseTitle: storedTitle } as Course;
}

export async function getFacilitatorName(course: Course) {
  if (!course.lecturerId) return course.lecturerName;
  const profile = await getDoc(doc(db, 'users', course.lecturerId));
  const fullName = profile.exists() ? profile.data().fullName : '';
  return typeof fullName === 'string' && fullName.trim() ? fullName.trim() : course.lecturerName;
}

export async function getCourseByLecturerAndCode(lecturerId: string, courseCode: string): Promise<Course | null> {
  const q = query(collection(db, 'courses'), where('lecturerId', '==', lecturerId), where('courseCode', '==', courseCode));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return normalizeCourse(d.data(), d.id);
}

export async function getPublishedCourses() {
  const snap = await getDocs(collection(db, 'courses'));
  return snap.docs
    .map((d) => normalizeCourse(d.data(), d.id))
    .filter((course) => course.published !== false && course.isArchived !== true && course.status !== 'archived') as Course[];
}

export async function getActiveEnrollments(studentId: string) {
  const snapshot = await getDocs(query(collection(db, 'enrollments'), where('studentId', '==', studentId)));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as any) }))
    .filter((enrollment) => enrollment.status !== 'unenrolled' && enrollment.status !== 'archived');
}

export async function setEnrollmentStatus(enrollmentId: string, status: 'active' | 'unenrolled') {
  await updateDoc(doc(db, 'enrollments', enrollmentId), { status, updatedAt: serverTimestamp() });
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const d = await getDoc(doc(db, 'courses', courseId));
  if (!d.exists()) return null;
  return normalizeCourse(d.data(), d.id);
}

export async function notifyCourseSubscribers(
  courseId: string,
  title: string,
  code: string,
  message: string,
  actionUrl = `/course/${courseId}`,
) {
  const courseSnapshot = await getDoc(doc(db, 'courses', courseId));
  if (!courseSnapshot.exists()) return;

  const course = courseSnapshot.data() as Course;
  const enrollmentsSnapshot = await getDocs(query(
    collection(db, 'enrollments'),
    where('courseId', '==', courseId),
    where('lecturerId', '==', course.lecturerId),
  ));
  const targetStudentIds = enrollmentsSnapshot.docs
    .map((docSnap) => docSnap.data().studentId)
    .filter(Boolean);

  if (!targetStudentIds.length) return;

  await createStudentAnnouncement(
    course.lecturerId,
    title,
    message,
    actionUrl,
    courseId,
    targetStudentIds,
  );
}

export async function ensureCourseExists(course: Course): Promise<string> {
  // Try to find existing by lecturerId+code
  const existing = await getCourseByLecturerAndCode(course.lecturerId, course.courseCode);
  if (existing && existing.id) return existing.id;

  const ref = await addDoc(collection(db, 'courses'), {
    courseCode: course.courseCode,
    courseTitle: course.courseTitle,
    lecturerId: course.lecturerId,
    lecturerName: course.lecturerName,
    description: course.description || '',
    category: course.category || 'General',
    level: course.level || 'Beginner',
    published: course.published ?? true,
    isArchived: course.isArchived ?? false,
    status: course.status || (course.published === false ? 'draft' : 'published'),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await createUserNotification(course.lecturerId, 'lecturer', 'Course created', `${course.courseTitle} was created as a draft.`, `/lecturer/courses/${ref.id}`, ref.id, 'success');
    const enrollmentsSnapshot = await getDocs(query(
      collection(db, 'enrollments'),
      where('courseId', '==', ref.id),
      where('lecturerId', '==', course.lecturerId),
    ));
    const targetStudentIds = enrollmentsSnapshot.docs
      .map((docSnap) => docSnap.data().studentId)
      .filter(Boolean);

    await createStudentAnnouncement(
      course.lecturerId,
      'New course available',
      `${course.courseTitle} (${course.courseCode}) is now available for enrollment.`,
      '/student-dashboard',
      ref.id,
      targetStudentIds,
    );
  } catch (error) {
    console.error('Course created, but announcement could not be saved:', error);
  }

  return ref.id;
}

export async function updateCourse(courseId: string, patch: Partial<Course>) {
  await updateDoc(doc(db, 'courses', courseId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
  const course = await getCourseById(courseId);
  if (course?.lecturerId) {
    const title = patch.published === true ? 'Course published' : patch.published === false ? 'Course unpublished' : 'Course updated';
    await createUserNotification(course.lecturerId, 'lecturer', title, `${course.courseTitle} was updated successfully.`, `/lecturer/courses/${courseId}`, courseId, 'success');
  }
}

export async function archiveCourse(courseId: string) {
  await updateCourse(courseId, { published: false, isArchived: true, status: 'archived' });
}

export async function unarchiveCourse(courseId: string) {
  await updateCourse(courseId, { published: false, isArchived: false, status: 'draft' });
}

// Lessons stored under courses/{courseId}/lessons
export type Lesson = {
  id?: string;
  title: string;
  content?: string;
  materials?: Array<{ name: string; url: string }>;
  order?: number;
  published?: boolean;
  topic?: string;
  tags?: string[];
  videoUrl?: string;
  materialType?: 'note' | 'video';
  createdAt?: any;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: number;
  topic?: string;
};

export type CourseQuiz = {
  id?: string;
  courseId: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  published?: boolean;
  durationMinutes?: number;
  allowRetake?: boolean;
  maxAttempts?: number;
  createdAt?: any;
  updatedAt?: any;
};

export type QuizAttempt = {
  id: string;
  courseId: string;
  quizId: string;
  studentId: string;
  studentName?: string;
  score?: number;
  answers?: number[];
  topicScores?: Record<string, { correct: number; total: number }>;
  attemptNumber?: number;
  status?: 'in_progress' | 'submitted';
  startedAt?: any;
  submittedAt?: any;
  completedAt?: any;
};

export async function addLesson(courseId: string, lesson: Lesson) {
  const ref = await addDoc(collection(db, 'courses', courseId, 'lessons'), {
    title: lesson.title,
    content: lesson.content || '',
    materials: lesson.materials || [],
    order: lesson.order || 0,
    published: !!lesson.published,
    topic: lesson.topic || '',
    tags: lesson.tags || [],
    videoUrl: lesson.videoUrl || '',
    materialType: lesson.materialType || 'note',
    createdAt: serverTimestamp(),
  });

  try {
    const courseSnapshot = await getDoc(doc(db, 'courses', courseId));
    if (courseSnapshot.exists()) {
      const course = courseSnapshot.data() as Course;
      await notifyCourseSubscribers(
        courseId,
        course.courseTitle,
        course.courseCode,
        `A new lesson, ${lesson.title}, has been added to ${course.courseTitle} (${course.courseCode}).`,
        `/course/${courseId}`,
      );
    }
  } catch (error) {
    console.error('Lesson added, but announcement could not be saved:', error);
  }

  return ref.id;
}

export async function getLessons(courseId: string, publishedOnly = false) {
  const lessons = collection(db, 'courses', courseId, 'lessons');
  const snap = await getDocs(publishedOnly ? query(lessons, where('published', '==', true)) : lessons);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Lesson[];
}

export function subscribeLessons(courseId: string, publishedOnly: boolean, callback: (lessons: Lesson[]) => void) {
  const lessons = collection(db, 'courses', courseId, 'lessons');
  const source = publishedOnly ? query(lessons, where('published', '==', true)) : lessons;
  return onSnapshot(source, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as any) })) as Lesson[]);
  });
}

export async function getCoursesByLecturer(lecturerId: string) {
  const q = query(collection(db, 'courses'), where('lecturerId', '==', lecturerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeCourse(d.data(), d.id));
}

export function subscribeCoursesByLecturer(lecturerId: string, cb: (courses: Course[]) => void) {
  const q = query(collection(db, 'courses'), where('lecturerId', '==', lecturerId));
  const unsub = onSnapshot(q, (snap) => {
    const courses = snap.docs.map((d) => normalizeCourse(d.data(), d.id));
    cb(courses);
  });
  return unsub;
}

export async function updateLesson(courseId: string, lessonId: string, patch: Partial<Lesson>) {
  const lessonRef = doc(db, 'courses', courseId, 'lessons', lessonId);
  const [lessonSnapshot, courseSnapshot] = await Promise.all([
    getDoc(lessonRef),
    getDoc(doc(db, 'courses', courseId)),
  ]);
  await setDoc(lessonRef, { ...patch, updatedAt: serverTimestamp() }, { merge: true });

  if (patch.published === true && lessonSnapshot.data()?.published !== true && courseSnapshot.exists()) {
    const course = courseSnapshot.data() as Course;
    try {
      await createUserNotification(course.lecturerId, 'lecturer', 'Content published', `${patch.title || lessonSnapshot.data()?.title || 'Learning content'} is now published in ${course.courseTitle}.`, `/lecturer/courses/${courseId}`, courseId, 'success');
      await notifyCourseSubscribers(
        courseId,
        'New lesson published',
        course.courseCode,
        `A new lesson is available in ${course.courseTitle} (${course.courseCode}).`,
        `/course/${courseId}`,
      );
    } catch (error) {
      console.error('Lesson published, but announcement could not be saved:', error);
    }
  }

  if (courseSnapshot.exists() && patch.title && patch.title !== lessonSnapshot.data()?.title) {
    const course = courseSnapshot.data() as Course;
    try {
      await notifyCourseSubscribers(
        courseId,
        'Course updated',
        course.courseCode,
        `${course.courseTitle} (${course.courseCode}) was updated. Check the latest course content.`,
        `/course/${courseId}`,
      );
    } catch (error) {
      console.error('Course updated, but announcement could not be saved:', error);
    }
  }
}

export async function deleteLesson(courseId: string, lessonId: string) {
  const lessonRef = doc(db, 'courses', courseId, 'lessons', lessonId);
  // Firestore SDK v9 modular doesn't export deleteDoc here, import lazily
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(lessonRef);
}

export async function uploadMaterial(courseId: string, lessonId: string, file: File) {
  const path = `courses/${courseId}/materials/${lessonId}/${Date.now()}_${file.name}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  const url = await getDownloadURL(ref);
  return { name: file.name, url, path };
}

export async function appendMaterialToLesson(courseId: string, lessonId: string, material: { name: string; url: string; path?: string }) {
  const lessonRef = doc(db, 'courses', courseId, 'lessons', lessonId);
  const snap = await getDoc(lessonRef);
  const existing = snap.exists() ? (snap.data() as any).materials || [] : [];
  await setDoc(lessonRef, { materials: [...existing, material], updatedAt: serverTimestamp() }, { merge: true });
}

export async function getQuizzes(courseId: string, publishedOnly = false) {
  const quizzes = collection(db, 'courses', courseId, 'quizzes');
  const snapshot = await getDocs(publishedOnly ? query(quizzes, where('published', '==', true)) : quizzes);
  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as any) })) as CourseQuiz[];
}

export function subscribeQuizzes(courseId: string, publishedOnly: boolean, callback: (quizzes: CourseQuiz[]) => void) {
  const quizzes = collection(db, 'courses', courseId, 'quizzes');
  const source = publishedOnly ? query(quizzes, where('published', '==', true)) : quizzes;
  return onSnapshot(source, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as any) })) as CourseQuiz[]);
  });
}

export async function saveQuiz(courseId: string, quiz: Omit<CourseQuiz, 'courseId'> & { id?: string }) {
  const quizData = {
    courseId,
    title: quiz.title,
    description: quiz.description || '',
    questions: quiz.questions,
    published: !!quiz.published,
    durationMinutes: quiz.durationMinutes || null,
    allowRetake: !!quiz.allowRetake,
    maxAttempts: quiz.maxAttempts || null,
    updatedAt: serverTimestamp(),
  };

  if (quiz.id) {
    await updateDoc(doc(db, 'courses', courseId, 'quizzes', quiz.id), quizData);
    return quiz.id;
  }

  const created = await addDoc(collection(db, 'courses', courseId, 'quizzes'), {
    ...quizData,
    createdAt: serverTimestamp(),
  });
  if (quiz.published) {
    const course = await getCourseById(courseId);
    if (course) {
      await createUserNotification(course.lecturerId, 'lecturer', 'Quiz published', `${quiz.title} is now published in ${course.courseTitle}.`, `/lecturer/courses/${courseId}`, courseId, 'success');
      await notifyCourseSubscribers(courseId, 'New quiz available', course.courseCode, `${quiz.title} is now available in ${course.courseTitle}.`, `/learning/${courseId}`);
    }
  }
  return created.id;
}

export async function deleteQuiz(courseId: string, quizId: string) {
  await deleteDoc(doc(db, 'courses', courseId, 'quizzes', quizId));
}

export async function getQuizAttempts(courseId: string) {
  const snapshot = await getDocs(query(collection(db, 'quizAttempts'), where('courseId', '==', courseId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as any) })) as QuizAttempt[];
}

export async function getStudentQuizAttempts(studentId: string) {
  const snapshot = await getDocs(query(collection(db, 'quizAttempts'), where('studentId', '==', studentId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as any) })) as QuizAttempt[];
}

export async function getQuizAttempt(attemptId: string) {
  const snapshot = await getDoc(doc(db, 'quizAttempts', attemptId));
  return snapshot.exists() ? ({ id: snapshot.id, ...(snapshot.data() as any) } as QuizAttempt) : null;
}

export async function saveQuizAttempt(attempt: Omit<QuizAttempt, 'id'>) {
  const { status: _status, startedAt: _startedAt, submittedAt: _submittedAt, completedAt: _completedAt, ...initial } = attempt;
  const attemptId = await startQuizAttempt(initial);
  await updateQuizAttempt(attemptId, {
    status: 'submitted',
    submittedAt: serverTimestamp(),
    completedAt: serverTimestamp(),
  });
  return attemptId;
}

export async function startQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'status' | 'startedAt' | 'submittedAt' | 'completedAt'>) {
  const created = await addDoc(collection(db, 'quizAttempts'), {
    ...attempt,
    status: 'in_progress',
    answers: attempt.answers || [],
    startedAt: serverTimestamp(),
  });
  return created.id;
}

export async function updateQuizAttempt(attemptId: string, patch: Partial<QuizAttempt>) {
  await updateDoc(doc(db, 'quizAttempts', attemptId), patch);
}

// Student progress stored in collection 'courseProgress' with id `${courseId}_${studentId}`
export async function getStudentProgress(courseId: string, studentId: string) {
  const d = await getDoc(doc(db, 'courseProgress', `${courseId}_${studentId}`));
  if (!d.exists()) return { completedLessons: [] as string[] };
  return d.data();
}

export async function setLessonCompleted(courseId: string, studentId: string, lessonId: string, completed: boolean) {
  const docRef = doc(db, 'courseProgress', `${courseId}_${studentId}`);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    const data = snapshot.data() as any;
    const set = new Set(Array.isArray(data.completedLessons) ? data.completedLessons : []);
    if (completed) set.add(lessonId);
    else set.delete(lessonId);
    await setDoc(docRef, { courseId, studentId, completedLessons: Array.from(set), updatedAt: serverTimestamp() }, { merge: true });
  } else {
    await setDoc(docRef, { courseId, studentId, completedLessons: completed ? [lessonId] : [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
}
