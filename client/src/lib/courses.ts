import { db } from '@/firebase/config';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { storage } from '@/firebase/config';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export type Course = {
  id?: string;
  courseCode: string;
  courseTitle: string;
  lecturerId: string;
  lecturerName: string;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
};

export async function getCourseByLecturerAndCode(lecturerId: string, courseCode: string): Promise<Course | null> {
  const q = query(collection(db, 'courses'), where('lecturerId', '==', lecturerId), where('courseCode', '==', courseCode));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as any) } as Course;
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const d = await getDoc(doc(db, 'courses', courseId));
  if (!d.exists()) return null;
  return { id: d.id, ...(d.data() as any) } as Course;
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

// Lessons stored under courses/{courseId}/lessons
export type Lesson = {
  id?: string;
  title: string;
  content?: string;
  materials?: Array<{ name: string; url: string }>;
  order?: number;
  published?: boolean;
  createdAt?: any;
};

export async function addLesson(courseId: string, lesson: Lesson) {
  const ref = await addDoc(collection(db, 'courses', courseId, 'lessons'), {
    title: lesson.title,
    content: lesson.content || '',
    materials: lesson.materials || [],
    order: lesson.order || 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getLessons(courseId: string, publishedOnly = false) {
  const lessons = collection(db, 'courses', courseId, 'lessons');
  const snap = await getDocs(publishedOnly ? query(lessons, where('published', '==', true)) : lessons);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Lesson[];
}

export async function getCoursesByLecturer(lecturerId: string) {
  const q = query(collection(db, 'courses'), where('lecturerId', '==', lecturerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Course[];
}

export function subscribeCoursesByLecturer(lecturerId: string, cb: (courses: Course[]) => void) {
  const q = query(collection(db, 'courses'), where('lecturerId', '==', lecturerId));
  const unsub = onSnapshot(q, (snap) => {
    const courses = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Course[];
    cb(courses);
  });
  return unsub;
}

export async function updateLesson(courseId: string, lessonId: string, patch: Partial<Lesson>) {
  const lessonRef = doc(db, 'courses', courseId, 'lessons', lessonId);
  await setDoc(lessonRef, { ...patch, updatedAt: serverTimestamp() }, { merge: true });
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
