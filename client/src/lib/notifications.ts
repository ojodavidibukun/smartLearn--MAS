import { addDoc, collection, getDocs, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Notification } from '@/types';

const readNotificationsKey = (studentId: string) => `smartlearn.readNotifications.${studentId}`;

type StudentAnnouncement = Notification & {
  audience: 'students';
  lecturerId: string;
  courseId?: string;
  targetStudentIds?: string[];
};

export function buildCourseNotificationTargets(courseId: string, enrollments: Array<{ studentId: string; courseId?: string }>) {
  return enrollments
    .filter((enrollment) => enrollment.courseId === courseId)
    .map((enrollment) => enrollment.studentId);
}

function getReadIds(studentId: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(readNotificationsKey(studentId)) || '[]') as string[]);
  } catch {
    return new Set();
  }
}

function saveReadIds(studentId: string, ids: Set<string>) {
  localStorage.setItem(readNotificationsKey(studentId), JSON.stringify(Array.from(ids)));
  window.dispatchEvent(new CustomEvent('smartlearn:notifications-changed', { detail: studentId }));
}

export async function createStudentAnnouncement(
  lecturerId: string,
  title: string,
  message: string,
  actionUrl = '/dashboard',
  courseId?: string,
  targetStudentIds?: string[],
) {
  await addDoc(collection(db, 'notifications'), {
    audience: 'students',
    lecturerId,
    courseId: courseId || null,
    targetStudentIds: targetStudentIds || [],
    title,
    message,
    type: 'info',
    actionUrl,
    createdAt: serverTimestamp(),
  });
}

export function subscribeStudentAnnouncements(
  studentId: string,
  onChange: (notifications: Notification[]) => void,
  onError?: (error: Error) => void,
) {
  const announcementsQuery = query(
    collection(db, 'notifications'),
    where('audience', '==', 'students'),
  );

  return onSnapshot(
    announcementsQuery,
    (snapshot) => {
      const readIds = getReadIds(studentId);
      const notifications = snapshot.docs
        .map((document) => {
          const data = document.data() as Omit<StudentAnnouncement, 'id' | 'read'>;
          const targetStudentIds = Array.isArray(data.targetStudentIds) ? data.targetStudentIds : [];
          const isRelevant = !data.courseId || !targetStudentIds.length || targetStudentIds.includes(studentId);
          if (!isRelevant) return null;
          return {
            id: document.id,
            ...data,
            read: readIds.has(document.id),
          } as Notification;
        })
        .filter((item): item is Notification => item !== null);

      notifications.sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')));
      onChange(notifications);
    },
    onError,
  );
}

export function markStudentNotificationRead(studentId: string, notificationId: string) {
  const readIds = getReadIds(studentId);
  readIds.add(notificationId);
  saveReadIds(studentId, readIds);
}
